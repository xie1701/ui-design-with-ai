/**
 * 截图与度量管线。真实 CSS 视口（Playwright --viewport-size 语义），记录 DSF / 引擎 / 状态。
 * 用法：node capture.mjs <baseUrl> <outDir>
 */
import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';
import { captureFullPage } from './fullpage.mjs';

const base = process.argv[2];
const out = process.argv[3];
fs.mkdirSync(path.join(out, 'crops'), { recursive: true });

const VIEWPORTS = [
  { name: 'mobile', w: 390, h: 844, dsf: 2 },
  { name: 'narrow', w: 320, h: 700, dsf: 2 },
  { name: 'pad', w: 768, h: 1024, dsf: 2 },
  { name: 'desktop', w: 1440, h: 900, dsf: 1 },
];

const browser = await chromium.launch({ channel: 'chrome' });
const report = { engine: 'chrome (system)', notes: [], shots: [] };

const measure = async (page) => page.evaluate(() => {
  const doc = document.documentElement;
  const bottom = (sel) => {
    const el = document.querySelector(sel);
    if (!el) return null;
    const r = el.getBoundingClientRect();
    return { top: Math.round(r.top + scrollY), bottom: Math.round(r.bottom + scrollY), h: Math.round(r.height) };
  };
  const hidden = (sel) => { const el = document.querySelector(sel); return el ? getComputedStyle(el).display === 'none' : null; };
  return {
    scrollWidth: doc.scrollWidth,
    clientWidth: doc.clientWidth,
    scrollHeight: doc.scrollHeight,
    rail: hidden('.rail'),
    topProgress: hidden('.top .progress'),
    h1: bottom('.hero h1'),
    overture: bottom('.overture'),
    inst: bottom('.inst'),
    soundKey: bottom('#soundKey'),
    fonts: [...new Set([...document.querySelectorAll('main *')]
      .filter((e) => e.textContent.trim() && !e.children.length)
      .map((e) => getComputedStyle(e).fontSize))].sort((a, b) => parseFloat(a) - parseFloat(b)),
    canvasCount: document.querySelectorAll('canvas').length,
    railBars: document.querySelectorAll('#railBars .bar').length,
    topBars: document.querySelectorAll('#topBars i').length,
  };
});

for (const vp of VIEWPORTS) {
  const ctx = await browser.newContext({ viewport: { width: vp.w, height: vp.h }, deviceScaleFactor: vp.dsf });
  const page = await ctx.newPage();
  const errs = [], ext = [];
  page.on('console', (m) => { if (m.type() === 'error') errs.push(m.text()); });
  page.on('pageerror', (e) => errs.push('pageerror: ' + e.message));
  page.on('request', (r) => { const u = r.url(); if (!u.startsWith(base) && !u.startsWith('data:')) ext.push(u); });

  await page.goto(base, { waitUntil: 'load' });
  await page.waitForTimeout(1400);

  const fold = path.join(out, `${vp.name}_fold.png`);
  await page.screenshot({ path: fold });
  report.shots.push({ file: path.basename(fold), css: `${vp.w}x${vp.h}`, dsf: vp.dsf, bytes: fs.statSync(fold).size });

  const full = path.join(out, `${vp.name}_full.png`);
  const H = await page.evaluate(() => document.documentElement.scrollHeight);
  const how = await captureFullPage(page, full, { cssHeight: H, viewportHeight: vp.h });
  report.shots.push({ file: path.basename(full), css: `${vp.w}x${vp.h}`, dsf: vp.dsf, bytes: fs.statSync(full).size, capture: how });

  const m = await measure(page);
  report[vp.name] = { viewport: `${vp.w}x${vp.h}`, dsf: vp.dsf, ...m, consoleErrors: errs, externalRequests: ext };
  await ctx.close();
}

// ---------- 交互状态（390） ----------
{
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
  const page = await ctx.newPage();
  await page.goto(base, { waitUntil: 'load' });
  await page.waitForTimeout(900);
  const states = {};

  // 身份切换
  const before = await page.getAttribute('#roles .seg[data-i="0"]', 'aria-pressed');
  await page.click('#roles .seg[data-i="2"]');
  await page.waitForTimeout(250);
  states.roleSwitch = { before, after0: await page.getAttribute('#roles .seg[data-i="0"]', 'aria-pressed'),
                        after2: await page.getAttribute('#roles .seg[data-i="2"]', 'aria-pressed') };

  // 时间轴节点
  await page.click('#axisTrack .nodetab[data-i="2"]');
  await page.waitForTimeout(250);
  states.axisSwitch = { n0: await page.getAttribute('#axisTrack .nodetab[data-i="0"]', 'aria-pressed'),
                        n2: await page.getAttribute('#axisTrack .nodetab[data-i="2"]', 'aria-pressed') };

  // 按住三秒
  const box = await page.locator('#recKey').boundingBox();
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await page.waitForTimeout(3400);
  states.recordHeld = { status: await page.textContent('#recStatus'),
                        meter: await page.$eval('#recBar', (e) => e.style.width) };
  await page.mouse.up();
  await page.waitForTimeout(200);

  // 编曲
  await page.click('#srcs .srcbtn[data-i="1"]');
  await page.waitForTimeout(300);
  states.compose = { s0: await page.getAttribute('#srcs .srcbtn[data-i="0"]', 'aria-pressed'),
                     s1: await page.getAttribute('#srcs .srcbtn[data-i="1"]', 'aria-pressed') };

  const H2 = await page.evaluate(() => document.documentElement.scrollHeight);
  await captureFullPage(page, path.join(out, 'mobile_interacted_full.png'), { cssHeight: H2, viewportHeight: 844 });
  report.interactions = states;

  await ctx.close();

  // 键盘可达性：全新页面，避免被前面的点击污染起点
  const kctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
  const kpage = await kctx.newPage();
  await kpage.goto(base, { waitUntil: 'load' });
  await kpage.waitForTimeout(800);
  await kpage.evaluate(() => { document.body.setAttribute('tabindex','-1'); document.body.focus(); document.body.removeAttribute('tabindex'); });
  const focusOrder = [];
  for (let i = 0; i < 14; i++) {
    await kpage.keyboard.press('Tab');
    focusOrder.push(await kpage.evaluate(() => {
      const a = document.activeElement;
      if (!a) return null;
      const cs = getComputedStyle(a);
      return { tag: a.tagName, text: (a.textContent || '').trim().slice(0, 18), outline: cs.outlineWidth + ' ' + cs.outlineStyle };
    }));
  }
  report.focusOrder = focusOrder;
  await kctx.close();
}

// ---------- reduced-motion ----------
{
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, reducedMotion: 'reduce' });
  const page = await ctx.newPage();
  await page.goto(base, { waitUntil: 'load' });
  await page.waitForTimeout(900);
  const rm = await page.evaluate(() => {
    const anims = [...document.querySelectorAll('*')].map((e) => getComputedStyle(e).animationName).filter((n) => n && n !== 'none');
    return { animations: [...new Set(anims)], dawnAngle: getComputedStyle(document.documentElement).getPropertyValue('--dawn-angle').trim() };
  });
  await page.click('#srcs .srcbtn[data-i="2"]');
  await page.waitForTimeout(200);
  rm.composeWorks = (await page.getAttribute('#srcs .srcbtn[data-i="2"]', 'aria-pressed')) === 'true';
  report.reducedMotion = rm;
  await page.screenshot({ path: path.join(out, 'reduced_motion_fold.png') });
  await ctx.close();
}

await browser.close();
fs.writeFileSync(path.join(out, 'capture-report.json'), JSON.stringify(report, null, 2));

console.log('=== 截图 ===');
report.shots.forEach((s) => console.log(`  ${s.file.padEnd(26)} css=${s.css} dsf=${s.dsf} ${(s.bytes / 1024).toFixed(0)}KB`));
for (const vp of VIEWPORTS) {
  const r = report[vp.name];
  console.log(`\n=== ${vp.name} (${r.viewport} dsf=${r.dsf}) ===`);
  console.log(`  溢出: scrollWidth=${r.scrollWidth} clientWidth=${r.clientWidth} -> ${r.scrollWidth === r.clientWidth ? 'OK' : 'OVERFLOW'}`);
  console.log(`  页高: ${r.scrollHeight}px | rail显示=${!r.rail} | 顶栏进度条显示=${!r.topProgress} | railBars=${r.railBars} topBars=${r.topBars}`);
  console.log(`  首屏: h1 ${JSON.stringify(r.h1)} / overture ${JSON.stringify(r.overture)} / inst ${JSON.stringify(r.inst)} / key ${JSON.stringify(r.soundKey)}`);
  console.log(`  字号集合: ${r.fonts.join(', ')}`);
  console.log(`  控制台错误: ${r.consoleErrors.length ? r.consoleErrors.join(' | ') : '无'}`);
  console.log(`  外部请求: ${r.externalRequests.length ? r.externalRequests.join(' | ') : '无'}`);
}
console.log('\n=== 交互状态 ===');
console.log(JSON.stringify(report.interactions, null, 2));
console.log('\n=== 键盘焦点顺序（前 14 个） ===');
report.focusOrder.forEach((f, i) => console.log(`  ${i + 1}. ${f.tag} "${f.text}" outline=${f.outline}`));
console.log('\n=== reduced-motion ===');
console.log(JSON.stringify(report.reducedMotion));
