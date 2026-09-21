/**
 * 细节证据图：把页面里几处**被评审反复读错、后来改过**的局部放大截下来，
 * 供复核用。放大倍数靠 deviceScaleFactor 拿到（2×），不做后处理缩放。
 *
 * 用法：node capture-crops.mjs <baseUrl> <outDir>
 *
 * 为什么单独有这个脚本：这些图原先是在排查过程中用临时探针生成的，
 * 探针没有进仓库 → 证据图不可复现。现在它是一条可复跑的命令。
 */
import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';

const base = process.argv[2];
const out = process.argv[3];
fs.mkdirSync(out, { recursive: true });

// name → 选择器 + 额外内边距（px）
const CROPS = [
  ['h1_zoom', '.hero h1', 10],
  ['ledger_lastrow', '.ledger2 .row2.self', 12],
  ['chapter_indicator', '.top .inner', 8],
  ['role_wireframe', '#roleCanvas', 8],
  ['rail_needle', '.rail', 0],
];

const browser = await chromium.launch({ channel: 'chrome' });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 });
await page.goto(base, { waitUntil: 'load' });
await page.waitForTimeout(900);

const done = [];
for (const [name, sel, pad] of CROPS) {
  const el = await page.$(sel);
  if (!el) { console.log(`  ${name}: 选择器无匹配 ${sel} —— 跳过`); continue; }
  await el.scrollIntoViewIfNeeded();
  await page.waitForTimeout(250);
  const box = await el.boundingBox();
  if (!box) { console.log(`  ${name}: 未渲染 —— 跳过`); continue; }
  const file = path.join(out, `${name}.png`);
  await page.screenshot({
    path: file,
    clip: {
      x: Math.max(0, box.x - pad),
      y: Math.max(0, box.y - pad),
      width: Math.min(box.width + pad * 2, 1440 - Math.max(0, box.x - pad)),
      height: box.height + pad * 2,
    },
  });
  done.push({ name, sel, bytes: fs.statSync(file).size });
  console.log(`  ${name.padEnd(18)} ${sel.padEnd(22)} ${(fs.statSync(file).size / 1024).toFixed(0)}KB`);
}

await browser.close();
console.log(`=== 细节证据图 ${done.length}/${CROPS.length} 张 → ${out} ===`);
