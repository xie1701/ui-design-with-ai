# Critic Log · 生意说首页互动化

- 评审对象：`src/app/page.js`、`src/app/landing-bench.js`、`src/app/landing.module.css`（评审时为工作树内改动；其后提交为本地 `41f5d2d`）
- 证据基线：生产构建（`npm run build` + `PORT=3999 NODE_ENV=production node server/index.js`），system Chrome 真实 CSS 视口
- 轮次预算：视觉 Critic 1 轮（含优化前/优化后各一次评分）；工程 QA 2 轮

## 证据包（外发前隐私检查）

- 发送给外部 Critic 的内容：仅截图 + 目标用户/任务 + Design Read + 设计身份。**不含代码、CSS、实现理由或历史评分。**
- 隐私检查：截图为已公开的线上页面与本地生产构建页面；页面内含已公开的备案号与公开小程序码；演示原话为**合成数据**（不含真实客户姓名、电话、地址、订单或财务信息）。检查通过，无需脱敏。

| 文件 | 内容 | 视口 |
|---|---|---|
| `review/before_mobile_fold.png` | 优化前首屏 | 390×844 |
| `review/before_mobile_full.png` | 优化前整页 | 390×2749 |
| `review/before_desktop_full.png` | 优化前整页 | 1440×2491 |
| `review/crops/before_mobile_hero_2x.png` | 优化前示意卡放大 2× | — |
| `review/after_mobile_fold.png` | 优化后首屏（待确认） | 390×844 |
| `review/after_mobile_full.png` | 优化后整页 | 390×2831 |
| `review/after_mobile_confirmed_full.png` | 已确认（同一句：理发） | 390 |
| `review/after_mobile_expanded_full.png` | 展开一条选题 | 390 |
| `review/after_pad_full.png` | 平板 | 768×1024 |
| `review/after_desktop_fold.png` / `after_desktop_full.png` | 桌面 | 1440×900 / 1440×2587 |
| `review/after_desktop_confirmed_full.png` | 桌面已确认 | 1440 |
| `review/after_narrow_full.png` | 窄屏 | 320×700 |
| `review/crops/after_mobile_bench_2x.png` 等 | 局部放大 2–3× | — |

---

## 第 1 轮 · Visual Critic（独立、只看截图）

- 评审员：独立子会话（`shengyi-visual-critic`），只接收截图与设计意图，未读取代码。
- 模型自述证据完整性：**部分**（缺 hover/focus/pressed 状态截图；缺 320 已确认态；缺优化前 320/平板；默认态与已确认态在手机端曾用不同行当）。

### 评分

| 可见维度 | 优化前 | 优化后 |
|---|---:|---:|
| 任务线索与信息层级 | 6 | 8 |
| 构图与视觉节奏 | 5 | 6 |
| 设计身份与独特性 | 4 | 6 |
| 排版、色彩与细节一致性 | 5 | 7 |
| 可见响应式表现 | 5 | 6 |
| **视觉总分** | **5.0** | **6.6** |

Critic 明确结论：**「机制只能被读到、不能被看到」被部分解决，方向对**；因果链在视觉上闭合且可核对（优化前「确认后可生成」是常驻静态块，优化后该块在待确认态**根本不存在**，确认后才出现，同时状态、计数、按钮文案一起翻转）。

### 建议与仲裁

| # | Critic 建议 | impact | feasibility | risk | evidence | decision |
|---|---|---|---|---|---|---|
| 1 | 行当纸签在 390/320 被右边缘切掉半个字，无渐隐/箭头，像渲染坏了 | 高（35–55 岁访客会当 bug） | 高 | 低 | `after_mobile_fold.png` 第 5 个 chip 被切；`after_narrow_full.png`「装修水电」截成「装修水」 | **accept** → 文案收为 2 字、移动端内距收窄、320 宽改换行；实测 320/390/768 均无截断且不再需要横向滚动 |
| 2 | 首屏同时存在两个「主按钮」（确认键实心 + 橙色 CTA），且把「人拍板」的动作画成了机器色 | 高 | 高 | 低 | `after_mobile_fold.png`、`after_desktop_fold.png` | **accept** → 确认键改为白底 + 1.5px 墨边 + 橙色声音点，橙色实心只留给页面唯一转化 CTA |
| 3 | 「已确认」状态视觉权重过低，截图中底色读数不一致（辨识度不足） | 中高 | 高 | 低 | `after_desktop_confirmed_full.png` vs `crops/after_desktop_confirmed_1x.png` | **accept** → 已确认时整理块加 4px 内嵌左规则线 + 实心描边，状态变化改由结构表达 |
| 4 | 原话纸条「完全水平、未溢出内容列」，人话「不是衬线体」，两项身份承诺在截图中不可见 | 中 | — | — | `crops/after_mobile_bench_2x.png`、`after_desktop_bench_1x.png` | **reject（事实不成立）** → 实测 `getComputedStyle`：纸条 `transform = matrix(0.999981, -0.00610861, …)`（即 `rotate(-0.35deg)`）；原话 `font-family = "Songti SC", STSong, "Noto Serif SC", serif` 且 `document.fonts.check('18px "Songti SC"') === true`。倾斜仅 0.35°、宋体在小尺寸缩略图上不易辨认，属 Critic 判读误差。**不因此加大倾斜或换字体**（会破坏「克制」契约）。已记录为「Critic 陈述需抽查」的又一实例 |
| 5 | 1440 桌面仍是「内容约 960 居中 + 两侧死白」，演示面板是内缩圆角卡而非满宽台面 | 中 | — | — | `after_desktop_fold.png` | **reject（事实不成立）** → DOM 实测台面 `left=0 / right=1440`（满宽出血），内容列 1180 居中；台面 `border-radius: 0`。Critic 量的是标题的 `max-width: 880px` 视觉印象 |
| 6 | 「你确认之前」三张等宽说明卡是模板套路，且与刚演示过的机制重复 | 中 | 高 | 低 | `after_pad_full.png` | **accept（部分）** → 视觉上改为「标签 \| 说明」两行式定义表，取消三列等宽分区；文案保留但已改为讲「确认这一步为什么不能省」（原话不被改写 / 只归类不下结论 / 确认不等于真实性认证），不是复述演示 |
| 7 | 确认后页面近乎翻倍变长，主 CTA 被推远；计数被夹在按钮与分隔线之间 | 中 | 中 | 中 | `after_mobile_confirmed_full.png` | **defer** → 页面在访客主动确认后变长是本设计的因果（产物是确认的回报），不是缺陷；强制把 CTA 钉在首屏会与「确认才解锁」的语义冲突。已记录为已知取舍，若后续有真实流量可再验证 |

### 保留项（Critic 指定）

1. 单一左轴（标题/副标题/纸签/面板/按钮共享左边缘，非居中 hero）。
2. 展开/收起用文字标签而非纯图标（对 35–55 岁受众更安全）。
3. **「确认即解锁」的因果**——本轮唯一无法用文案替代的视觉证据，务必保住。
4. 扁平克制：17 张截图中未出现渐变、glow 或模糊，橙色只用于权威动作。

---

## 第 1 轮 · Engineering QA（独立）

- 评审员：独立子会话（`shengyi-engineering-qa`），只读，未修改任何仓库文件；临时产物全部在 `/tmp`。
- 该会话在 22 轮上限处结束，报告为**部分完成**；主会话保留其已跑出的证据，不把未跑完的项当作通过。

### 该轮已带证据通过

| 项目 | 结果 | 证据 |
|---|---|---|
| 既有测试全量 | **PASS** | `npm test` → `tests 933 / pass 933 / fail 0`（47.6s）；`tests/landing-bc-contract.test.mjs` 与 `tests/p0-web-truth.test.mjs`、`tests/p0-confirmed-only-truth.test.mjs` 逐条 `✔` |
| ESLint | **PASS** | `npx eslint .` exit 0，无输出 |
| 生产构建 | **PASS** | 在 `/tmp` 的副本里构建（避免破坏运行中的服务器 `.next`）：`✓ Compiled successfully` |
| Server/Client 边界 | **PASS** | `page.js` 无 `'use client'`、无 hooks、无 `window.`/`document.`；`landing-bench.js` 内无用户可见中文 |
| 交互行为 | **PASS** | 390 与 1440 实测：切换 → 原话/整理/声波全变；确认 → `topicCount 3`；展开 → `previewText 开头四点起来熬…`；撤销 → `topicListExists false, topicCount 0`；确认后切换行当 → 状态回到「待确认」且产物消失 |
| 声波确定性 | **PASS** | 同一句两次渲染得到完全相同的百分比数组；不同句不同 |
| 语义与 ARIA | **PASS** | `role="group"` + `aria-label="换一个行当试试"`；纸签 `aria-pressed`；状态行 `role="status"` + `aria-live="polite"`；声波 `aria-hidden="true"`；选题按钮 `aria-expanded` |
| 键盘与焦点 | **PASS** | 焦点顺序 品牌 → 登录 → 6 个纸签 → 确认 → 主 CTA → 收尾 CTA → 备案号；每站 `outline: solid 2px rgb(29,78,216) offset 2px` |
| 命中区 | **PASS** | 纸签 44 / 撤销 48 / 选题按钮 76.7 / 主 CTA 52 px |
| 字号 | **PASS** | 71 个文本节点，最小计算字号 16px，无低于 16px |
| 横向溢出 | **PASS** | `scrollWidth === clientWidth` 于 320 / 390 / 768 / 1024 / 1440 |
| 外部资源 | **PASS** | 17 个请求，0 个外部域名（无远程字体、无第三方脚本） |

### 该轮发现的真实缺陷（已修）

**对比度 FAIL（WCAG 2.2 AA，普通文本需 4.5:1）**：`#5C6F87` 在新增台面色 `#F1E9DE` 上只有 **4.28:1**，影响「场景示意」「状态行」「演示内容」标签、「展开/收起」。主会话复核后另发现同色在整理块底色（`color-mix(trust 8%, canvas)`）上为 **4.36:1**，即「AI 整理」标签与「待确认」标签同样不达标。

处置：新增 `--landing-trust-ink: #4C5D74`（= 品牌既有 `brand-trust.dark`），把**所有小字**的 `color` 从 `--landing-trust` 换为它；边框、结构线、色块仍用 `#5C6F87`。理论值：台面上 5.58:1，整理块上 5.69:1。实测复核见第 2 轮。

### 该轮纠正的两处口径

1. **体积基线说错**：任务书写的「共享 103 kB」是 shared chunk，不是 `/` 路由的 First Load JS。QA 用 HEAD 版本另建副本测得基线为 `/` **917 B / First Load 107 kB**，改动后为 **2.18 kB / 108 kB**，即增量约 **+1 kB First Load**，不是 +5 kB。**采纳该纠正**，对比页与 qa.md 已按 107 kB → 108 kB 改写。
2. **评审员自身的测量假失败**：QA 自报 `AI整理正文 1.39` 与 `待确认标签 4.06` 是其亮度解析器误读 `color(srgb …)` 计算背景所致，明确要求不作为失败记录。**采纳**：主会话不引用这两个数字；`AI 整理` 与 `待确认` 的真实不达标由主会话按 sRGB 复算确认为 4.36:1，属同类缺陷，已随同一修复处置。

### 该轮如实记录的边界（非缺陷）

- 「未确认时产物不在 DOM」在**渲染 DOM** 层面成立（`curl` 剥掉 `<script>` 后无任何选题文本、「确认后可生成」「演示内容」「等等，我再改改」）。但 **RSC flight payload 内联在 `<script>` 里，确实携带完整演示数据**（含 6 个行当的全部选题与预览）。这是「文案集中在一个可审计文件里、以 props 传给客户端岛」这一工程规则的必然结果，演示数据本身是公开的合成数据，不是用户数据。**接受并记录**，见 qa.md「已接受风险」。

---

## 第 2 轮 · Engineering QA 复核（对比度修复 + 回归）

> 状态：进行中。结果与仲裁见下方补充。

---

## 停止状态

- 第 1 轮：`needs-changes`（对比度 FAIL 属阻断项，未清零）
- 第 2 轮：见 qa.md「交付结论」
