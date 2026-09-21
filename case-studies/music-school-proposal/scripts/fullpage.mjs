/**
 * 可靠的全页截图：滚动分段 + 拼接，绕开 Chrome `fullPage` 在超高页面上的失真。
 *
 * 背景（本轮实测）：`page.screenshot({fullPage:true})` 在 device pixels 超过约 16384 时
 * 会产出与页面**不对应**的图——本页 390×844@2x 时高 25190px，按 DOM 位置裁剪出来的
 * 内容与真实滚动到该位置的截屏完全不同；同一页降到 DSF 1（12595px）就正常。
 * 结论：全页截图不能用 `fullPage`，除非 device pixels 明显低于 16384。
 *
 * 用法：
 *   import { captureFullPage } from './fullpage.mjs';
 *   await captureFullPage(page, 'shots/x_full.png', { cssHeight: H, viewportHeight: 844 });
 */
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const LIMIT = 16000; // device pixels，留出余量

export async function captureFullPage(page, outPath, { cssHeight, viewportHeight }) {
  const dsf = await page.evaluate(() => window.devicePixelRatio || 1);
  const devicePixels = Math.round(cssHeight * dsf);

  if (devicePixels <= LIMIT) {
    await page.screenshot({ path: outPath, fullPage: true });
    return { method: 'fullPage', devicePixels };
  }

  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'fullpage-'));
  const step = viewportHeight;
  const segs = [];
  for (let y = 0; y < cssHeight; y += step) {
    await page.evaluate((yy) => window.scrollTo(0, yy), y);
    await page.waitForTimeout(320);
    const visible = Math.min(step, cssHeight - y);
    const seg = path.join(dir, `seg_${String(y).padStart(6, '0')}.png`);
    await page.screenshot({ path: seg });
    segs.push({ file: seg, visible });
  }

  // 分段之间可能有重叠（最后一段通常不足一屏），用 vstack 直接叠会导致内容重复，
  // 所以先按「应显示高度」裁掉每段底部多余的部分，再纵向拼接。
  const cropped = segs.map(({ file, visible }, i) => {
    const out = path.join(dir, `crop_${String(i).padStart(3, '0')}.png`);
    const hPx = Math.round(visible * dsf);
    execFileSync('ffmpeg', ['-y', '-v', 'error', '-i', file, '-vf', `crop=iw:${hPx}:0:0`, out]);
    return out;
  });

  const args = ['-y', '-v', 'error'];
  cropped.forEach((f) => args.push('-i', f));
  args.push('-filter_complex', `vstack=inputs=${cropped.length}`, outPath);
  execFileSync('ffmpeg', args);
  fs.rmSync(dir, { recursive: true, force: true });
  return { method: 'scroll-stitch', devicePixels, segments: cropped.length };
}
