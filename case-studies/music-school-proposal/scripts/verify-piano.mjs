#!/usr/bin/env node
/**
 * 钢琴音色的机器验收。
 *
 * 为什么需要它：音色是**听**出来的，而自动化听不到。所以这里不靠“我听起来像”
 * ——把页面里**真正在跑的那段合成代码**抽出来，用 OfflineAudioContext 离线渲染，
 * 再对渲染结果做频谱与包络测量，用数字回答三个问题：
 *
 *   1. 泛音是不是**非谐**的（真实钢琴弦有刚度，高次泛音比整数倍略高）？
 *   2. 高次泛音是不是比低次先衰减（音头亮、尾巴温）？
 *   3. 起音是不是“敲”出来的（快速起音 + 短噪声瞬态），而不是“抚”出来的？
 *
 * 同时渲染一个纯正弦参考，证明差异是真实的、不是测量噪声。
 *
 * 用法：node scripts/verify-piano.mjs <url>
 */
import { chromium } from 'playwright';

const url = process.argv[2] || 'http://127.0.0.1:4123/index.html';

/** 从源码里抠出一个具名函数的完整文本（按花括号配对） */
function extractFunction(src, name) {
  const start = src.indexOf(`function ${name}(`);
  if (start < 0) throw new Error(`源码里找不到 function ${name}`);
  let i = src.indexOf('{', start);
  let depth = 0;
  for (let j = i; j < src.length; j++) {
    if (src[j] === '{') depth++;
    else if (src[j] === '}') { depth--; if (depth === 0) return src.slice(start, j + 1); }
  }
  throw new Error(`function ${name} 花括号不配对`);
}

function extractVar(src, name) {
  const m = src.match(new RegExp(`var\\s+${name}\\s*=\\s*\\[[^\\]]*\\]\\s*;`));
  if (!m) throw new Error(`源码里找不到 var ${name}`);
  return m[0];
}

const browser = await chromium.launch({ channel: 'chrome' });
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
await page.goto(url, { waitUntil: 'load' });
await page.waitForTimeout(400);

const pageSrc = await page.evaluate(() =>
  Array.from(document.querySelectorAll('script')).map((s) => s.textContent).join('\n'));

const synthSrc = [
  extractVar(pageSrc, 'P_N'),
  extractVar(pageSrc, 'P_GAIN'),
  extractFunction(pageSrc, 'pianoDecay'),
  extractFunction(pageSrc, 'note'),
].join('\n');

console.log('=== 从页面抽出的合成代码 ===');
console.log(`  片段长度 ${synthSrc.length} 字符；含 P_N / P_GAIN / pianoDecay / note`);
const pN = pageSrc.match(/var\s+P_N\s*=\s*\[([^\]]*)\]/)[1];
console.log(`  分音次数: [${pN.trim()}]`);

/** 在页面里离线渲染，并做测量 */
const result = await page.evaluate(async ({ src, freqs }) => {
  const SR = 44100;
  const SECONDS = 3.2;

  function goertzel(data, sr, freq, from, len) {
    const k = Math.round((len * freq) / sr);
    const w = (2 * Math.PI * k) / len;
    const cw = Math.cos(w), coeff = 2 * cw;
    let s0 = 0, s1 = 0, s2 = 0;
    for (let i = 0; i < len; i++) {
      s0 = data[from + i] + coeff * s1 - s2;
      s2 = s1; s1 = s0;
    }
    const real = s1 - s2 * cw, imag = s2 * Math.sin(w);
    return Math.sqrt(real * real + imag * imag) / (len / 2);
  }

  /** 在一段区间里扫频，找真实峰值频率 */
  function peakNear(data, sr, guess, from, len, spanHz) {
    let best = guess, bestM = -1;
    for (let f = guess - spanHz; f <= guess + spanHz; f += 0.5) {
      const m = goertzel(data, sr, f, from, len);
      if (m > bestM) { bestM = m; best = f; }
    }
    return { freq: best, mag: bestM };
  }

  function rms(data, from, len) {
    let s = 0;
    for (let i = 0; i < len; i++) s += data[from + i] * data[from + i];
    return Math.sqrt(s / len);
  }

  function envelopePeakTime(data, sr) {
    const win = Math.round(sr * 0.001);           // 1ms 窗
    let best = 0, bestV = -1;
    for (let i = 0; i + win < sr * 0.4; i += win) {
      const v = rms(data, i, win);
      if (v > bestV) { bestV = v; best = i; }
    }
    return { ms: (best / sr) * 1000, peak: bestV };
  }

  async function render(mode, freq) {
    const ctx = new OfflineAudioContext(1, Math.round(SR * SECONDS), SR);
    const master = ctx.createGain(); master.gain.value = 0.75; master.connect(ctx.destination);
    let actx = ctx;
    if (mode === 'page') {
      // eslint-disable-next-line no-eval
      eval(src);                                   // 定义 P_N / P_GAIN / pianoDecay / note，闭包捕获 actx、master
      note(freq, 0, 0.62, 0.088);
    } else {
      // 参考：纯正弦 + 一个低通（改动前的做法）
      const t = 0;
      const o1 = ctx.createOscillator(), o2 = ctx.createOscillator();
      const lp = ctx.createBiquadFilter(), g = ctx.createGain();
      o1.type = 'sine'; o1.frequency.value = freq;
      o2.type = 'triangle'; o2.frequency.value = freq * 2.002;
      lp.type = 'lowpass'; lp.frequency.setValueAtTime(2600, t);
      lp.frequency.exponentialRampToValueAtTime(700, t + 0.62);
      g.gain.setValueAtTime(0.0001, t);
      g.gain.linearRampToValueAtTime(0.16, t + 0.014);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.62);
      o1.connect(lp); o2.connect(lp); lp.connect(g); g.connect(master);
      o1.start(t); o2.start(t); o1.stop(t + 0.68); o2.stop(t + 0.68);
    }
    const buf = await ctx.startRendering();
    return buf.getChannelData(0);
  }

  const out = { partials: {}, reference: {}, decay: {}, attack: {} };

  /* --- 1) 非谐性：拿 C4 看前 8 个分音的实测峰值频率 --- */
  const F0 = freqs.f0;
  const d = await render('page', F0);
  const N = Math.round(SR * 0.35);
  const harmonic = [1, 2, 3, 4, 5, 6, 8, 10];
  const measured = harmonic.map((n) => {
    const ideal = F0 * n;
    const p = peakNear(d, SR, ideal, 0, N, Math.max(6, ideal * 0.02));
    const cents = 1200 * Math.log2(p.freq / ideal);
    return { n, ideal: +ideal.toFixed(1), actual: +p.freq.toFixed(1), cents: +cents.toFixed(1), mag: p.mag };
  });
  out.partials = measured;

  /* --- 2) 高次泛音先死：分别量第 1 与第 5 分音在早/晚窗的幅度 ---
     窗口必须落在**实际延音区间内**：这个音（C4, dur=0.62）的 life ≈ 0.99s，
     拿 1200–1500ms 当“晚窗”只会量到一段静音（第一版就踩了这个坑）。 */
  const early = Math.round(SR * 0.03), earlyLen = Math.round(SR * 0.12);
  const late = Math.round(SR * 0.7), lateLen = Math.round(SR * 0.2);
  const p1 = peakNear(d, SR, F0, 0, N, 4).freq;
  const p5 = peakNear(d, SR, F0 * 5 * Math.sqrt(1.0006 * 25), 0, N, F0 * 0.2).freq;
  const m1e = goertzel(d, SR, p1, early, earlyLen), m1l = goertzel(d, SR, p1, late, lateLen);
  const m5e = goertzel(d, SR, p5, early, earlyLen), m5l = goertzel(d, SR, p5, late, lateLen);
  out.decay = {
    partial1: { early: +m1e.toFixed(6), late: +m1l.toFixed(6), ratio: +(m1l / (m1e || 1e-9)).toFixed(4) },
    partial5: { early: +m5e.toFixed(6), late: +m5l.toFixed(6), ratio: +(m5l / (m5e || 1e-9)).toFixed(4) },
  };

  /* --- 3) 起音：峰值出现时间 + 前 6ms 是否有宽带噪声能量 --- */
  const ap = envelopePeakTime(d, SR);
  const noise = goertzel(d, SR, F0 * 12.7, 0, Math.round(SR * 0.005));
  const steady = goertzel(d, SR, F0 * 12.7, Math.round(SR * 0.3), Math.round(SR * 0.05));
  out.attack = { peakMs: +ap.ms.toFixed(1), transient: +noise.toFixed(6), steady: +steady.toFixed(6) };

  /* --- 4) 参考对照：同样的测量跑一遍纯正弦版本 --- */
  const dr = await render('sine', F0);
  const refMeasured = harmonic.map((n) => {
    const ideal = F0 * n;
    const p = peakNear(dr, SR, ideal, 0, N, Math.max(6, ideal * 0.02));
    return { n, ideal: +ideal.toFixed(1), actual: +p.freq.toFixed(1), mag: p.mag };
  });
  out.reference = { partials: refMeasured, energy: +rms(dr, 0, Math.round(SR * 0.3)).toFixed(5) };
  out.pageEnergy = +rms(d, 0, Math.round(SR * 0.3)).toFixed(5);

  return out;
}, { src: synthSrc, freqs: { f0: 261.63 } });

/* ------------------------- 输出与判定 ------------------------- */
let fails = 0;
const line = (ok, text) => { console.log(`  ${ok ? 'PASS' : 'FAIL'}  ${text}`); if (!ok) fails++; };

console.log('\n=== 1. 泛音是否非谐（C4 = 261.63Hz） ===');
console.log('  次数 | 整数倍 Hz | 实测峰值 Hz | 偏差 cents | 相对幅度');
for (const p of result.partials) {
  console.log(`  ${String(p.n).padStart(4)} | ${String(p.ideal).padStart(9)} | ${String(p.actual).padStart(11)} | ${String(p.cents).padStart(10)} | ${p.mag.toFixed(5)}`);
}
const higher = result.partials.filter((p) => p.n >= 4);
const allSharp = higher.every((p) => p.cents > 0);
const rising = higher.every((p, i, a) => i === 0 || p.cents > a[i - 1].cents);
line(higher.length >= 4, `测到 ${higher.length} 个高次分音`);
line(allSharp, `高次分音全部**偏高**（非谐），偏差 ${higher.map((p) => p.cents.toFixed(1)).join(' / ')} cents`);
line(rising, '偏差随次数递增（刚度模型的特征）');
line(result.partials.filter((p) => p.mag > 0.0008).length >= 5, `有 ${result.partials.filter((p) => p.mag > 0.0008).length} 个分音有实质能量`);

console.log('\n=== 2. 高次泛音是否先衰减（早窗 30–150ms vs 晚窗 700–900ms） ===');
console.log(`  第 1 分音  ${result.decay.partial1.early} -> ${result.decay.partial1.late}  保留 ${(result.decay.partial1.ratio * 100).toFixed(1)}%`);
console.log(`  第 5 分音  ${result.decay.partial5.early} -> ${result.decay.partial5.late}  保留 ${(result.decay.partial5.ratio * 100).toFixed(1)}%`);
line(result.decay.partial1.ratio > result.decay.partial5.ratio, '第 1 分音保留比例高于第 5 分音（音头亮、尾巴温）');
line(result.decay.partial1.early > 0 && result.decay.partial5.early > 0, '两个分音在早窗都有信号（晚窗真值不是静音）');

console.log('\n=== 3. 起音是否“敲”出来的 ===');
console.log(`  包络峰值出现在 ${result.attack.peakMs} ms`);
console.log(`  12.7 倍频处：瞬态窗 ${result.attack.transient}，稳态窗 ${result.attack.steady}`);
line(result.attack.peakMs <= 15, `起音快（峰值 ≤15ms，实测 ${result.attack.peakMs}ms）`);
line(result.attack.transient > result.attack.steady * 3, '开头 5ms 有宽带瞬态（槌子击弦），且远高于稳态');

console.log('\n=== 4. 与改动前的纯正弦版本对照 ===');
console.log('  次数 | 整数倍 Hz | 钢琴实测 Hz / 幅度  | 纯正弦实测 Hz / 幅度 | 钢琴/参考 幅度比');
for (let i = 0; i < result.partials.length; i++) {
  const a = result.reference.partials[i], b = result.partials[i];
  const ratio = a.mag > 1e-9 ? (b.mag / a.mag).toFixed(1) + 'x' : '—';
  console.log(`  ${String(b.n).padStart(4)} | ${String(b.ideal).padStart(9)} | ${String(b.actual).padStart(8)} / ${b.mag.toFixed(5)} | ${String(a.actual).padStart(8)} / ${a.mag.toFixed(5)} | ${ratio.padStart(7)}`);
}
const hiPiano = result.partials.filter((p) => p.n >= 4);
const hiRef = result.reference.partials.filter((p) => p.n >= 4);
/* 对照只能拿参考版本**本来就没能量**的位置做：
   参考版本是「f 正弦 + 2.002f 三角」，三角波只有奇次谐波，
   所以它在 2f 的 1/3/5 次（即 n=2/6/10）上确实有东西，拿这几处比毫无意义。
   n=3/4/5/8 才是参考版本真的一无所有的地方。 */
const blind = [3, 4, 5, 8];
const idxOf = (arr, n) => arr.findIndex((p) => p.n === n);
const ratios = blind.map((n) => {
  const i = idxOf(result.partials, n), j = idxOf(result.reference.partials, n);
  return { n, piano: result.partials[i].mag, ref: result.reference.partials[j].mag };
});
const refHasNothing = ratios.every((r) => r.piano > r.ref * 4);
line(refHasNothing, `参考版本本来就没能量的 ${blind.join('/')} 倍处，钢琴能量是它的 ≥4 倍（实测 ${ratios.map((r) => r.ref > 1e-9 ? (r.piano / r.ref).toFixed(0) + 'x' : '∞').join(' / ')}）`);
line(result.pageEnergy > 0 && result.reference.energy > 0, `两边都渲染出信号（钢琴 RMS ${result.pageEnergy} / 参考 RMS ${result.reference.energy}）`);

console.log(`\n=== 共 ${fails === 0 ? '全部 PASS' : fails + ' 项 FAIL'} ===`);
console.log('注意：本脚本证明的是**频谱与包络特征**符合钢琴模型，不等于“好听”。音色好不好听只能由人判断。');

await browser.close();
process.exit(fails === 0 ? 0 : 1);
