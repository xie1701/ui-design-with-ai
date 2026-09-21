/**
 * 独立复核提取器有没有盲区：
 * 不依赖 copy-inventory.json，直接把源 markdown 逐行剥掉语法后，
 * 检查每一行文字是否都出现在渲染后的页面文本里。
 * 这能抓到「解析器没处理的块类型」导致的静默漏件。
 */
import { chromium } from 'playwright';
import fs from 'node:fs';

const [target, srcPath] = process.argv.slice(2);
const norm = (s) => s.replace(/\s+/g, ' ').trim();
const strip = (s) =>
  norm(
    s
      .replace(/^[>|]\s*/, '')
      .replace(/\\([*_`~])/g, '$1')
      .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
      .replace(/[*`]/g, '')
  );

const lines = fs.readFileSync(srcPath, 'utf8').split('\n');
const wanted = [];
lines.forEach((raw, i) => {
  let t = raw.trim();
  if (!t || /^-{3,}$/.test(t) || /^\|[\s:|-]+\|$/.test(t)) return;
  t = t.replace(/^#{1,6}\s+/, '').replace(/^[-*+]\s+/, '');
  if (t.startsWith('|')) {
    t.split('|').map((c) => c.trim()).filter(Boolean).forEach((cell) => {
      const c = strip(cell);
      if (c) wanted.push({ line: i + 1, text: c });
    });
    return;
  }
  const c = strip(t);
  if (c) wanted.push({ line: i + 1, text: c });
});

const browser = await chromium.launch({ channel: 'chrome' });
let bad = 0;
for (const [name, vp] of [['390（手机）', { width: 390, height: 844 }], ['1440（桌面）', { width: 1440, height: 900 }]]) {
  const page = await browser.newPage({ viewport: vp });
  await page.goto(target, { waitUntil: 'load' });
  await page.waitForTimeout(600);
  const pageText = norm(await page.evaluate(() => document.body.innerText.replace(/\s+/g, ' ')));
  await page.close();
  const missing = wanted.filter((w) => !pageText.includes(w.text));
  console.log(`--- ${name} ---`);
  console.log(`  源文档有效文本片段 ${wanted.length}；未在可见文本中出现 ${missing.length}`);
  missing.forEach((m) => console.log(`    L${m.line}: ${m.text.slice(0, 60)}`));
  if (vp.width === 1440 && missing.length) bad = 1;
}
await browser.close();
console.log(`\n=== ${bad === 0 ? 'PASS' : 'FAIL'} ===（桌面视口要求 100% 覆盖；手机视口允许「表格列头在窄屏折叠」的已知例外）`);
process.exit(bad);
