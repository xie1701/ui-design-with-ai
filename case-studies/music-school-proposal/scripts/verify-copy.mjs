/**
 * 文案保真验收：把渲染后的 DOM 文本逐条比对源文档提取的清单。
 *
 * 四项检查：
 *   A. 逐条精确比对（开启 JS）
 *   B. 逐条精确比对（关闭 JS）——证明文案不依赖脚本
 *   C. 顺序拼接比对——证明既没漏、也没改序
 *   D. 列出所有非文案文本（界面标签），供人工审计"有没有自造内容"
 *
 * 用法：node verify-copy.mjs <url|file> <copy-inventory.json>
 */
import { chromium } from 'playwright';
import fs from 'node:fs';

const target = process.argv[2];
const inventory = JSON.parse(fs.readFileSync(process.argv[3], 'utf8'));

const norm = (s) => s.replace(/\s+/g, ' ').trim();

const browser = await chromium.launch({ channel: 'chrome' });

async function snapshot(javaScriptEnabled) {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, javaScriptEnabled });
  const page = await ctx.newPage();
  await page.goto(target, { waitUntil: 'load' });
  await page.waitForTimeout(javaScriptEnabled ? 800 : 200);
  const data = await page.evaluate(() => {
    const copy = [...document.querySelectorAll('[data-copy]')].map((el) => ({
      id: el.getAttribute('data-copy'),
      text: el.textContent,
    }));
    // 非文案的可见文本：排除 [data-copy] 内部、script/style、以及隐藏元素
    const extra = [];
    const walk = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    let n;
    while ((n = walk.nextNode())) {
      const t = (n.textContent || '').replace(/\s+/g, ' ').trim();
      if (!t) continue;
      const p = n.parentElement;
      if (!p || p.closest('[data-copy]')) continue;
      if (p.closest('script,style,noscript')) continue;
      if (p.closest('[hidden],[aria-hidden="true"]')) continue;
      const cs = getComputedStyle(p);
      if (cs.display === 'none' || cs.visibility === 'hidden') continue;
      extra.push(t);
    }
    return { copy, extra, scrollHeight: document.documentElement.scrollHeight };
  });
  await ctx.close();
  return data;
}

const results = {};

// ---------- A / B ----------
for (const [label, js] of [['A_js_on', true], ['B_js_off', false]]) {
  const snap = await snapshot(js);
  const seen = new Map();
  snap.copy.forEach((c) => {
    if (!seen.has(c.id)) seen.set(c.id, []);
    seen.get(c.id).push(norm(c.text));
  });
  const missing = [];
  const mismatched = [];
  for (const e of inventory.entries) {
    if (!seen.has(e.id)) { missing.push(e.id); continue; }
    const got = seen.get(e.id)[0];
    if (got !== norm(e.norm)) mismatched.push({ id: e.id, want: norm(e.norm), got });
  }
  const dup = [...seen.entries()].filter(([, v]) => v.length > 1).map(([k]) => k);
  const unknown = snap.copy.filter((c) => !inventory.entries.some((e) => e.id === c.id)).map((c) => c.id);
  results[label] = { found: seen.size, missing, mismatched, duplicated: dup, unknownIds: unknown, extra: snap.extra, scrollHeight: snap.scrollHeight };
}

// ---------- C 顺序拼接 ----------
{
  const snap = await snapshot(true);
  const got = snap.copy.map((c) => norm(c.text)).join('|');
  const want = inventory.entries.map((e) => norm(e.norm)).join('|');
  results.C_order = { match: got === want, gotLen: got.length, wantLen: want.length };
  if (got !== want) {
    let i = 0;
    while (i < Math.min(got.length, want.length) && got[i] === want[i]) i++;
    results.C_order.firstDiffAt = i;
    results.C_order.gotAround = got.slice(Math.max(0, i - 60), i + 60);
    results.C_order.wantAround = want.slice(Math.max(0, i - 60), i + 60);
  }
}

await browser.close();

const A = results.A_js_on, B = results.B_js_off;
const line = (s) => console.log(s);
line('=== 文案保真验收 ===');
line(`清单条目：${inventory.entries.length}`);
for (const [k, r] of [['开启 JS', A], ['关闭 JS', B]]) {
  line(`\n[${k}] 命中 ${r.found}/${inventory.entries.length}`);
  line(`  缺失：${r.missing.length ? r.missing.join(', ') : '0'}`);
  line(`  被改写：${r.mismatched.length ? JSON.stringify(r.mismatched, null, 2) : '0'}`);
  line(`  重复注入：${r.duplicated.length ? r.duplicated.join(', ') : '0'}`);
  line(`  未知 id：${r.unknownIds.length ? r.unknownIds.join(', ') : '0'}`);
}
line(`\n[顺序拼接] ${results.C_order.match ? '完全一致' : '不一致 -> ' + JSON.stringify(results.C_order, null, 2)}`);
line(`\n[非文案文本 · 界面标签审计] 共 ${A.extra.length} 条：`);
A.extra.forEach((t) => line('  · ' + t));

const pass = A.missing.length === 0 && A.mismatched.length === 0 && B.missing.length === 0 &&
             B.mismatched.length === 0 && A.duplicated.length === 0 && A.unknownIds.length === 0 &&
             results.C_order.match;
line(`\n=== ${pass ? 'PASS' : 'FAIL'} ===`);
process.exit(pass ? 0 : 1);
