/**
 * 工程 QA：只用 PASS / FAIL / N/A / NOT TESTED，并给出证据。
 * 用法：node qa.mjs <baseUrl> [outJson]
 */
import { chromium } from 'playwright';
import fs from 'node:fs';

const base = process.argv[2];
const outJson = process.argv[3] || 'qa-raw.json';
const rows = [];
const rec = (item, method, evidence, result, level = '') => rows.push({ item, method, evidence, result, level });

const browser = await chromium.launch({ channel: 'chrome' });

/* ---------------- 对比度（含天光叠加的最坏情况解析） ---------------- */
const CONTRAST_JS = `(() => {
  function parse(c){
    const m = c.match(/rgba?\\(([^)]+)\\)/); if(!m) return null;
    const p = m[1].split(/[,\\s/]+/).filter(Boolean).map(Number);
    return { r:p[0], g:p[1], b:p[2], a: p.length>3 ? p[3] : 1 };
  }
  function lum({r,g,b}){
    const f = (v) => { v/=255; return v<=0.03928 ? v/12.92 : Math.pow((v+0.055)/1.055, 2.4); };
    return 0.2126*f(r) + 0.7152*f(g) + 0.0722*f(b);
  }
  function ratio(a,b){ const l1=lum(a), l2=lum(b); const hi=Math.max(l1,l2), lo=Math.min(l1,l2); return (hi+0.05)/(lo+0.05); }
  function blend(fg,bg){ // fg 覆盖在 bg 上
    return { r: fg.r*fg.a + bg.r*(1-fg.a), g: fg.g*fg.a + bg.g*(1-fg.a), b: fg.b*fg.a + bg.b*(1-fg.a), a:1 };
  }
  function effBg(el){
    let n = el, acc = null;
    while (n && n !== document.documentElement.parentNode){
      const cs = getComputedStyle(n);
      const c = parse(cs.backgroundColor);
      if (c && c.a > 0){
        acc = acc ? blend(acc, c) : c;
        if (acc.a >= 0.999) break;
      }
      n = n.parentElement;
    }
    if (!acc) acc = { r:8, g:19, b:31, a:1 };
    if (acc.a < 0.999) acc = blend(acc, { r:8, g:19, b:31, a:1 });
    return acc;
  }
  const nodes = [];
  const walk = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  let n;
  while ((n = walk.nextNode())){
    const t = (n.textContent||'').replace(/\\s+/g,' ').trim();
    if (!t) continue;
    const p = n.parentElement;
    if (!p || p.closest('script,style,noscript,[aria-hidden="true"]')) continue;
    const cs = getComputedStyle(p);
    if (cs.display==='none'||cs.visibility==='hidden'||parseFloat(cs.opacity)===0) continue;
    const r = p.getBoundingClientRect();
    if (r.width < 1 || r.height < 1) continue;
    const fg = parse(cs.color); if (!fg) continue;
    const bg = effBg(p);
    const fgS = fg.a < 1 ? blend(fg, bg) : fg;
    const size = parseFloat(cs.fontSize), weight = cs.fontWeight;
    const large = size >= 24 || (size >= 18.66 && Number(weight) >= 700);
    nodes.push({ text: t.slice(0,24), color: cs.color, bg: 'rgb('+Math.round(bg.r)+','+Math.round(bg.g)+','+Math.round(bg.b)+')',
                 size, ratio: Math.round(ratio(fgS,bg)*100)/100, need: large?3:4.5 });
  }
  // 天光叠加的最坏情况：把每个前景色叠在「底色 + 最亮天光」上重算
  const beam = { r:242, g:179, b:61, a:0.22 };
  const worst = nodes.map(x => {
    const fg = parse(x.color), bg = parse(x.bg);
    const bg2 = blend(beam, bg);
    const fg2 = fg.a < 1 ? blend(fg, bg2) : fg;
    return { text: x.text, need: x.need, withBeam: Math.round(ratio(fg2,bg2)*100)/100 };
  });
  return { total: nodes.length, fails: nodes.filter(x => x.ratio < x.need), min: Math.min(...nodes.map(x=>x.ratio)),
           beamWorst: worst.sort((a,b)=>a.withBeam-b.withBeam).slice(0,4),
           sizes: [...new Set(nodes.map(x=>x.size))].sort((a,b)=>a-b) };
})()`;

for (const [name, vp, dsf] of [['390', { width: 390, height: 844 }, 2], ['1440', { width: 1440, height: 900 }, 1], ['320', { width: 320, height: 700 }, 2]]) {
  const ctx = await browser.newContext({ viewport: vp, deviceScaleFactor: dsf });
  const page = await ctx.newPage();
  const ext = [];
  page.on('request', (r) => { const u = r.url(); if (!u.startsWith(base) && !u.startsWith('data:')) ext.push(u); });
  await page.goto(base, { waitUntil: 'load' });
  await page.waitForTimeout(1000);
  const c = await page.evaluate(CONTRAST_JS);
  rec(`文本对比度 AA（${name}，默认态）`, 'Playwright 逐文本节点取 computed color + 沿 DOM 合成背景',
    `文本节点 ${c.total}，低于阈值 ${c.fails.length}；最低 ${c.min}:1`, c.fails.length === 0 ? 'PASS' : 'FAIL', c.fails.length ? 'error' : '');
  if (c.fails.length) rows[rows.length - 1].fails = c.fails;
  rec(`天光叠加最坏情况（${name}）`, '把天光峰值 rgba(242,179,61,.22) 解析叠加后重算',
    `最差四条：${c.beamWorst.map(w => `"${w.text}" ${w.withBeam}:1`).join(' / ')}`,
    c.beamWorst.every(w => w.withBeam >= w.need) ? 'PASS' : 'FAIL');
  rec(`最小可见字号（${name}）`, '可见文本 computed fontSize 集合', `${c.sizes.join(', ')}`,
    c.sizes[0] >= 16 ? 'PASS' : 'FAIL');
  rec(`外部请求（${name}）`, 'request 监听', ext.length ? ext.join(' | ') : '无', ext.length === 0 ? 'PASS' : 'FAIL');
  await ctx.close();
}

/* ---------------- 命中区 / 键盘 / 溢出 / DOM ---------------- */
{
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
  const page = await ctx.newPage();
  await page.goto(base, { waitUntil: 'load' });
  await page.waitForTimeout(1000);
  const hits = await page.evaluate(() => [...document.querySelectorAll('button,a[href]')]
    // 当前视口下未被渲染的元素不是可点目标（如窄屏隐藏的章节导航），不计入命中区统计。
    // 注意：父元素 display:none 不会改变子元素的 computed display，必须看实际是否产生盒（getClientRects）。
    // 只要元素真的渲染出来，尺寸不足仍会被下面的过滤抓到。
    .filter((e) => { const cs = getComputedStyle(e);
      return cs.display !== 'none' && cs.visibility !== 'hidden' && e.getClientRects().length > 0; })
    .map((e) => {
      const r = e.getBoundingClientRect();
      return { tag: e.tagName, text: (e.textContent || '').trim().slice(0, 14), w: Math.round(r.width), h: Math.round(r.height) };
    }));
  const small = hits.filter((h) => h.h < 44 || h.w < 44);
  rec('交互控件命中区 ≥44×44（390）', 'getBoundingClientRect', `${hits.length} 个控件；不足 44 的 ${small.length} 个${small.length ? '：' + JSON.stringify(small) : ''}`,
    small.length === 0 ? 'PASS' : 'FAIL');
  const aria = await page.evaluate(() => ({
    groups: document.querySelectorAll('[role="group"]').length,
    pressed: document.querySelectorAll('[aria-pressed]').length,
    live: document.querySelectorAll('[role="status"][aria-live]').length,
    labelled: [...document.querySelectorAll('[role="group"]')].every((g) => g.hasAttribute('aria-label')),
    canvasesHidden: [...document.querySelectorAll('canvas')].every((c) => c.getAttribute('aria-hidden') === 'true'),
    tabs: document.querySelectorAll('[role="tab"]').length,
  }));
  rec('ARIA 语义', 'DOM 查询', JSON.stringify(aria),
    aria.groups >= 3 && aria.pressed >= 9 && aria.live >= 1 && aria.labelled && aria.canvasesHidden ? 'PASS' : 'FAIL');
  const dom = await page.evaluate(() => ({
    nodes: document.querySelectorAll('*').length,
    html: document.documentElement.outerHTML.length,
    scripts: document.querySelectorAll('script').length,
    imgs: document.querySelectorAll('img').length,
  }));
  rec('DOM 规模 / 自包含', 'DOM 查询', JSON.stringify(dom), dom.imgs === 0 ? 'PASS' : 'FAIL');
  await ctx.close();
}

for (const [name, vp] of [['390', { width: 390, height: 844 }], ['320', { width: 320, height: 700 }], ['768', { width: 768, height: 1024 }], ['1440', { width: 1440, height: 900 }]]) {
  const ctx = await browser.newContext({ viewport: vp, deviceScaleFactor: 1 });
  const page = await ctx.newPage();
  await page.goto(base, { waitUntil: 'load' });
  await page.waitForTimeout(700);
  const m = await page.evaluate(() => ({
    sw: document.documentElement.scrollWidth, cw: document.documentElement.clientWidth,
    wide: [...document.querySelectorAll('main *')].filter((e) => e.getBoundingClientRect().right > document.documentElement.clientWidth + 1)
      .map((e) => e.className || e.tagName).slice(0, 6),
  }));
  rec(`无页面级横向溢出（${name}）`, 'scrollWidth vs clientWidth', `${m.sw} / ${m.cw}${m.wide.length ? '；越界元素：' + m.wide.join(',') : ''}`,
    m.sw === m.cw ? 'PASS' : 'FAIL');
  await ctx.close();
}

/* ---------------- 键盘 ---------------- */
{
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
  const page = await ctx.newPage();
  await page.goto(base, { waitUntil: 'load' });
  await page.waitForTimeout(800);
  await page.evaluate(() => { document.body.setAttribute('tabindex', '-1'); document.body.focus(); document.body.removeAttribute('tabindex'); });
  const order = [];
  let exhaustedAt = null;
  for (let i = 0; i < 20; i++) {
    await page.keyboard.press('Tab');
    const st = await page.evaluate(() => {
      const a = document.activeElement;
      if (!a) return { end: true };
      // 焦点回到 body/documentElement 说明 Tab 序列已走完（焦点离开文档），
      // 这不是“某个控件没有焦点环”，不应计为失败项。
      if (a === document.body || a === document.documentElement) return { end: true };
      const cs = getComputedStyle(a);
      return { text: (a.textContent || '').trim().slice(0, 12), w: cs.outlineWidth, s: cs.outlineStyle };
    });
    if (st.end) { exhaustedAt = i + 1; break; }
    order.push(st);
  }
  const noOutline = order.filter((o) => o && (o.s === 'none' || parseFloat(o.w) === 0));
  rec('键盘 Tab 顺序与 focus-visible（390）', '连续 20 次 Tab，读 activeElement 的 outline',
    `${order.length} 站中无可见焦点环的 ${noOutline.length} 个${noOutline.length ? '：' + JSON.stringify(noOutline) : ''}${exhaustedAt ? `（第 ${exhaustedAt} 次 Tab 后焦点离开文档，Tab 序列走完）` : ''}`,
    noOutline.length === 0 ? 'PASS' : 'FAIL');
  rows[rows.length - 1].order = order;
  // 键盘操作互动
  await page.keyboard.press('Tab'); // 落到第一个互动控件附近
  const before = await page.getAttribute('#roles .seg[data-i="0"]', 'aria-pressed');
  await page.locator('#roles .seg[data-i="1"]').focus();
  await page.keyboard.press('Enter');
  await page.waitForTimeout(150);
  const after = await page.getAttribute('#roles .seg[data-i="1"]', 'aria-pressed');
  rec('键盘可操作互动', '聚焦后按 Enter', `身份切换 ${before} -> ${after}`, after === 'true' ? 'PASS' : 'FAIL');
  await ctx.close();
}

/* ---------------- reduced-motion ---------------- */
{
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, reducedMotion: 'reduce' });
  const page = await ctx.newPage();
  await page.goto(base, { waitUntil: 'load' });
  await page.waitForTimeout(900);
  const rm = await page.evaluate(() => ({
    anims: [...new Set([...document.querySelectorAll('*')].map((e) => getComputedStyle(e).animationName).filter((n) => n && n !== 'none'))],
    angle: getComputedStyle(document.documentElement).getPropertyValue('--dawn-angle').trim(),
  }));
  await page.click('#axisTrack .nodetab[data-i="2"]');
  await page.waitForTimeout(200);
  const works = await page.getAttribute('#axisTrack .nodetab[data-i="2"]', 'aria-pressed');
  rec('reduced-motion 降级 + 功能完整', '强制 reduce；查 animationName 与互动',
    `动画名 ${JSON.stringify(rm.anims)}；天光角度固定 ${rm.angle}；时间轴仍可切换 ${works}`,
    rm.anims.length === 0 && works === 'true' ? 'PASS' : 'FAIL');
  await ctx.close();
}

/* ---------------- 交互真伪（状态确实变了，而不是 CSS 存在） ---------------- */
{
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
  const page = await ctx.newPage();
  await page.goto(base, { waitUntil: 'load' });
  await page.waitForTimeout(900);
  const canvasSig = () => page.evaluate(() => {
    const h = [];
    for (const id of ['voiceCanvas', 'roleCanvas', 'axisCanvas', 'scoreCanvas', 'artCanvas']) {
      const c = document.getElementById(id);
      if (!c) { h.push(null); continue; }
      const d = c.getContext('2d').getImageData(0, 0, Math.min(80, c.width), Math.min(60, c.height)).data;
      let s = 0; for (let i = 0; i < d.length; i += 4) s = (s + d[i] * 3 + d[i + 1] * 5 + d[i + 2] * 7) % 2147483647;
      h.push(s);
    }
    return h;
  });
  const s0 = await canvasSig();
  await page.click('#roles .seg[data-i="2"]');
  await page.waitForTimeout(200);
  const s1 = await canvasSig();
  rec('互动真的改变画面（身份切换）', '点击后对比 canvas 像素签名',
    `roleCanvas ${s0[1]} -> ${s1[1]}`, s0[1] !== s1[1] ? 'PASS' : 'FAIL');
  await page.click('#axisTrack .nodetab[data-i="3"]');
  await page.waitForTimeout(200);
  const s2 = await canvasSig();
  rec('互动真的改变画面（时间轴）', '点击后对比 canvas 像素签名',
    `axisCanvas ${s1[2]} -> ${s2[2]}`, s1[2] !== s2[2] ? 'PASS' : 'FAIL');
  await page.click('#srcs .srcbtn[data-i="2"]');
  await page.waitForTimeout(400);
  const s3 = await canvasSig();
  rec('互动真的改变画面（编曲）', '点击后对比 canvas 像素签名',
    `score ${s2[3]} -> ${s3[3]}；art ${s2[4]} -> ${s3[4]}`, s2[3] !== s3[3] && s2[4] !== s3[4] ? 'PASS' : 'FAIL');

  // 不同文本必须得到不同声纹（证明声纹确实由文本派生，而不是固定图形）
  const two = await page.evaluate(async () => {
    const sig = () => {
      const c = document.getElementById('axisCanvas');
      const d = c.getContext('2d').getImageData(0, 0, Math.min(120, c.width), Math.min(60, c.height)).data;
      let x = 0; for (let i = 0; i < d.length; i += 4) x = (x + d[i] * 3 + d[i + 1] * 5 + d[i + 2] * 7) % 2147483647;
      return x;
    };
    const click = (i) => { document.querySelector('#axisTrack .nodetab[data-i="' + i + '"]').click(); };
    click(0); await new Promise((r) => setTimeout(r, 120)); const a = sig();
    click(1); await new Promise((r) => setTimeout(r, 120)); const b = sig();
    click(2); await new Promise((r) => setTimeout(r, 120)); const c2 = sig();
    return [a, b, c2];
  });
  rec('不同文本得到不同声纹', '依次选中三段，比较 canvas 像素签名',
    `${two[0]} / ${two[1]} / ${two[2]}`,
    new Set(two).size === 3 ? 'PASS' : 'FAIL');

  // 按住三秒
  // 先把控件滚进视口，否则 boundingBox 可能落在视口外，鼠标事件打不到元素
  await page.locator('#recKey').scrollIntoViewIfNeeded();
  await page.waitForTimeout(300);
  const box = await page.locator('#recKey').boundingBox();
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await page.waitForTimeout(3400);
  const st = await page.textContent('#recStatus');
  const meter = await page.$eval('#recBar', (e) => e.style.width);
  await page.mouse.up();
  rec('按住三秒 → 状态与进度变化', '真实指针按住 3.4s', `status="${st}" meter=${meter}`,
    st.includes('已存进') && meter === '100%' ? 'PASS' : 'FAIL');
  await ctx.close();
}

/* ---------------- 确定性复验（重开页面） ---------------- */
{
  const sig = async () => {
    const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1 });
    const page = await ctx.newPage();
    await page.goto(base, { waitUntil: 'load' });
    await page.waitForTimeout(900);
    const s = await page.evaluate(() => {
      const c = document.getElementById('axisCanvas');
      const d = c.getContext('2d').getImageData(0, 0, Math.min(120, c.width), Math.min(60, c.height)).data;
      let x = 0; for (let i = 0; i < d.length; i += 4) x = (x + d[i] * 3 + d[i + 1] * 5 + d[i + 2] * 7) % 2147483647;
      return x;
    });
    await ctx.close();
    return s;
  };
  const a = await sig(), b = await sig();
  rec('声纹确定性（重开页面）', '两次独立加载比较首段声纹像素签名', `${a} vs ${b}`, a === b ? 'PASS' : 'FAIL');
}

await browser.close();
fs.writeFileSync(outJson, JSON.stringify(rows, null, 2));

const badge = { PASS: 'PASS', FAIL: 'FAIL', 'N/A': 'N/A ', 'NOT TESTED': 'NOT TESTED' };
console.log('| # | 检查项 | 方法 | 证据 | 结果 |');
console.log('|---|---|---|---|---|');
rows.forEach((r, i) => console.log(`| ${i + 1} | ${r.item} | ${r.method} | ${r.evidence} | **${badge[r.result]}** |`));
const fails = rows.filter((r) => r.result === 'FAIL');
console.log(`\n=== 共 ${rows.length} 项；FAIL ${fails.length}；NOT TESTED ${rows.filter((r) => r.result === 'NOT TESTED').length} ===`);
console.log(fails.length ? '阻断项：' + fails.map((f) => f.item).join('；') : '无阻断项');
process.exit(fails.length ? 1 : 0);
