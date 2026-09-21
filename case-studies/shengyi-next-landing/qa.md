# Engineering QA · 生意说首页互动化

只使用 `PASS / FAIL / N/A / NOT TESTED`。截图视觉分不能替代本表证据。

## 环境

- 日期：2026-09-21
- 执行者：独立 QA 子会话两轮（`shengyi-engineering-qa`、`shengyi-qa-round2`），主会话复核并执行修复；评审员均为只读，未修改仓库文件
- commit/build：工作树内未提交改动；`npm run build` 生产构建（`PORT=3999 NODE_ENV=production node server/index.js`）
- 浏览器/版本：system Chrome（Playwright `channel: chrome`）；一轮用 chromium-1234 复核
- 操作系统/设备：macOS（Darwin 27.2.0）；未上真机
- CSS 视口与 DSF：390×844、768×1024、1440×900、320×700、1024×768，DSF 1
- 测试数据是否脱敏：演示原话为**合成数据**，无真实客户姓名/电话/地址/订单/财务信息

## 适用状态矩阵

| 对象/路径 | default | hover | focus | pressed | loading | empty | error | success | disabled | permission | 理由 |
|---|---|---|---|---|---|---|---|---|---|---|---|
| 行当纸签（切换演示原话） | PASS | PASS（样式声明，未截图） | PASS | PASS（样式声明，未截图） | N/A | N/A | N/A | N/A | N/A | N/A | 纯前端确定性切换，无异步 |
| 确认按钮 | PASS | PASS（样式声明） | PASS（截图 `mobile_focus_bench.png`） | PASS（样式声明） | N/A | N/A | N/A | PASS（→ 已确认） | N/A | N/A | 确认后该按钮被撤销按钮替换，无 disabled 态 |
| 撤销按钮 | PASS | PASS | PASS | PASS | N/A | N/A | N/A | N/A | N/A | N/A | 回到待确认 |
| 选题展开 | PASS | PASS | PASS | PASS | N/A | PASS（未确认时该区块不渲染） | N/A | N/A | N/A | N/A | 未确认时产物节点不存在 |
| 声波 | PASS | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A | 纯装饰，`aria-hidden` |
| 主 CTA / 登录 / 页脚 | PASS | PASS | PASS | PASS | N/A | N/A | N/A | N/A | N/A | N/A | 沿用既有链接 |

- 不适用：loading / error / permission —— 本轮演示不发起网络请求、不申请权限。若将来接入真实模型，必须回到 Define 重定义这些状态。

## 证据矩阵

| 项目 | 适用性 | 方法/环境 | 结果 | 证据位置 | 执行者/日期 | 备注/阻断级别 |
|---|---|---|---|---|---|---|
| 首屏主要任务 | 适用 | Playwright `getBoundingClientRect().bottom` vs 844 | **PASS** | h1=189 / 台面=669 / 主 CTA=739 / 时长与积分=799，全部 ≤844；首屏主 CTA 计数=1 | QA r2 / 2026-09-21 | — |
| 320px/目标移动/桌面 | 适用 | 320/390/768/1024/1440 截图 + `scrollWidth` | **PASS** | 全档 `scrollWidth === clientWidth`；320×700 下 bench=728、CTA=798、meta=882（超出 700，属已知且预期：合同只要求 390×844） | QA r2 | 320 折叠高度未设合同 |
| 长文案与极端数据 | 部分适用 | 最长演示原话 24 字、最长选题标题 20 字 | **PASS** | 320/390 无截断、无横向溢出 | QA r2 | 未做超长 fixture |
| 键盘与 focus-visible | 适用 | 全路径 Tab 走查 | **PASS** | 顺序：品牌 → 登录 → 6 纸签 → 确认 → 主 CTA → 收尾 CTA → 备案号；每站 `outline: solid 2px rgb(29,78,216) offset 2px` | QA r1 | r2 未独立复跑 |
| 语义 HTML/label/错误关联 | 适用 | DOM + ariaSnapshot | **PASS** | 纸签组 `role="group"` + `aria-label="换一个行当试试"`；纸签 `aria-pressed`；状态行 `role="status"` + `aria-live="polite"`；声波 `aria-hidden="true"`；选题按钮 `aria-expanded`；确认按钮可访问名 = `button "就按这个理解"`（装饰点未进入名字） | QA r1 + r2 | — |
| 屏幕阅读器关键路径 | 适用 | VoiceOver/NVDA | **NOT TESTED** | — | — | 无真实读屏走查 |
| 文本/控件/焦点对比度 | 适用 | 浏览器实测 computed color + 沿 DOM 合成背景，逐文本节点算 WCAG 2.2 | **PASS** | 待确认态 46 个文本节点、已确认+展开态 54/58 个、320 已确认态 56 个，**低于 4.5:1 的为 0**；原 4 处失败（场景示意/状态行/演示内容/展开收起）现均 **5.58:1**；AI 整理 5.58（台面）/6.29（轨道）；待确认 5.58/6.29；已确认 4.82；选题标题 12.49；「开头」标签 5.58 | QA r2 | 首轮曾 FAIL（4.28:1），已修复并复核清零 |
| 非文本对比度（WCAG 1.4.11） | 适用 | 同上 | **PASS（含记录项）** | 非激活纸签边框 4.28:1（首轮 1.56:1，已改实色修复）；确认按钮墨边/白底 15.02；激活纸签边 14.06；确认态结构线 4.28–4.82；`待确认`/`开头` 标签边框 1.86、原话与整理块边框 1.34–1.36、各分隔线 1.25–1.61 —— 这些只作装饰，其承载的信息由 ≥4.5:1 的文字表达 | QA r2 | 装饰性边框记入备注，不阻断 |
| reduced-motion | 适用 | `reducedMotion: 'reduce'` 实测 | **PASS** | 动画名全为 `none`；确认前选题=0 → 确认后=3 → 撤销后=0；预览文字仍存在；状态回「第 1 / 6 句 · 待确认」 | QA r2 | 关键信息不只存在于动画 |
| 状态与错误恢复 | 适用 | 状态矩阵逐项 | **PASS** | 待确认 / 已确认 / 已撤销 / 切换行当重置 均实测通过 | QA r1 + r2 | 无 error 态 |
| 命中区 | 适用 | `getBoundingClientRect` | **PASS** | 纸签 50×44、确认 147×48、撤销 146×48、选题按钮 76.7、主 CTA 350×52、登录 60×44 | QA r1 + r2 | 确认按钮在待确认态复测 |
| 字号 | 适用 | 遍历可见文本节点取 computed font-size | **PASS** | 可见字号集合 `[16, 17, 18, 29.6]`，无低于 16px | QA r1 + r2 | — |
| lint/typecheck/build | 适用 | `npx eslint .`、`npm run build` | **PASS** | eslint exit 0；构建 `✓ Compiled successfully`；`/` = 2.18 kB / First Load 108 kB | QA r1 | 基线 `/` = 917 B / 107 kB（HEAD 版本另建副本实测） |
| 关键路径自动化 | 适用 | `npm test` | **PASS** | `tests 933 / pass 933 / fail 0`（47.6s） | 主会话 / 2026-09-21 | 中间曾因新增早置 768 媒体查询导致 1 个合同断言 FAIL，已修复并复跑全绿 |
| 性能预算 | 部分适用 | DOM 规模 + 请求清单 | **PASS（记录）** | DOM 元素总数 185（声波占 45 节点）；生产 HTML 31,493 B（剥 `<script>` 后 11,915 B）；17 个请求、**0 个外部域名**；落地页 First Load JS +1 kB | QA r2 | 未跑 Lighthouse/trace，无 LCP/INP 数据 |
| 目标浏览器 | 适用 | system Chrome / chromium-1234 | **PASS** | 上述全部实测 | QA r1 + r2 | 真机微信内核 **NOT TESTED** |
| 资产 fallback/授权/密钥 | 适用 | 文件与网络检查 | **PASS** | 全站使用原生 `<img>` 与静态 SVG，无远程字体；页面无密钥；演示数据为合成数据 | QA r1 | — |
| 未确认时产物不在渲染 DOM | 适用 | `curl` 后剥 `<script>` 检索 | **PASS** | 选题标题/预览、「确认后可生成」「演示内容」「等等，我再改改」「展开」「开头」全部不存在；「就按这个理解」存在（待确认按钮，预期） | QA r2 | — |
| RSC payload 边界 | 适用 | 检查内联 `<script>` | **记录（已知取舍）** | 内联 flight payload 18,715 B，含 18/18 选题标题与 6/6 原话；首帧剥脚本 HTML 只含第 1 句的 quote/organized | QA r2 | 见「已接受风险」 |
| 声波确定性 | 适用 | 同句两次渲染比对 | **PASS** | 同一句得到完全相同的百分比数组；不同句不同 | QA r1 | 不使用 `Math.random` |
| 二维码断点 | 适用 | 390/767/768/1440 | **PASS** | 390/767 `display:none`，768/1440 `display:block` | QA r2 | 合同测试同时覆盖 |

## 任务走查 / 用户测试

- 目标任务：访客在首屏内亲手完成「挑一句 → 看整理 → 自己确认 → 看到产物 → 撤销」。
- 参与者/样本：**NOT TESTED**（本轮无流量、无被试）。
- 成功定义：能独立完成上述循环且不需要解释。
- 结果与观察：只有主会话与两个独立评审子会话的操作观察，**不构成用户测试**。
- 证据位置：`after/screenshots/*`、`compare/index.html`。
- 结论边界：只能声称「机制可被亲手操作，且与产品真实行为一致」；**不能**声称更易理解、转化更好或对真实用户有效。

## 交付结论

- 阻断项：**0**。
- NOT TESTED 项：真机微信内核；真实读屏（VoiceOver/NVDA）；DPR 2/3 复测；完整键盘顺序的独立复跑；Lighthouse/trace 性能预算；真实用户任务走查。
- 已接受风险与确认人：
  1. **RSC flight payload 携带完整演示数据**（渲染 DOM 干净，但内联 payload 里有全部选题）。原因是「对外文案集中在 `page.js` 一处可审计、以 props 传给客户端岛」这条工程规则；演示数据是公开的合成数据，不是用户数据。确认为可接受取舍，已如实记录。
  2. **确认后页面变长、主 CTA 下移**。这是「确认才解锁」的因果本身，不是缺陷；强行把 CTA 固定在首屏会与语义冲突。
  3. **320×700 首屏放不下全部内容**（meta 底部 882）。合同只覆盖 390×844。
  4. **装饰性边框低于 3:1**（标签芯片边、块边框、分隔线）。其承载的信息由 ≥4.5:1 的文字表达。
- 最终状态：**pass**（适用验收项证据充分，阻断项清零，剩余风险已记录并接受；任务走查与真机项明确标为 NOT TESTED，不由视觉分替代）
