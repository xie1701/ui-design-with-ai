/** 关键局部：把每个组件滚进视口后按真实视口截图（避免全页图的坐标换算出错）。 */
import { chromium } from 'playwright';
import fs from 'node:fs';
const base = process.argv[2], out = process.argv[3];
fs.mkdirSync(out, { recursive: true });
const b = await chromium.launch({ channel: 'chrome' });
const jobs = [
  ['ledger', '.ledger2', 1300],
  ['roles', '.ledger', 820],
  ['axis', '.axis', 1000],
  ['compose', '#srcs', 900],
  ['final', '.close', 820],
];
for (const [name, sel, h] of jobs) {
  const ctx = await b.newContext({ viewport: { width: 390, height: h }, deviceScaleFactor: 2 });
  const page = await ctx.newPage();
  await page.goto(base, { waitUntil: 'load' });
  await page.waitForTimeout(1100);
  await page.locator(sel).scrollIntoViewIfNeeded();
  await page.waitForTimeout(500);
  await page.screenshot({ path: `${out}/${name}.png` });
  const box = await page.locator(sel).boundingBox();
  console.log(`${name.padEnd(9)} viewport 390x${h}  element y=${Math.round(box.y)} h=${Math.round(box.height)}`);
  await ctx.close();
}
await b.close();
