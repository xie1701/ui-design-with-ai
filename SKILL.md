---
name: ui-design-with-ai
description: 面向 Web UI 的 AI 设计与评审流程，用于创建或重做网页、审查现有界面、执行工程 QA，或设计 Web 组件与状态。Use when 用户要求 landing page、Web app、响应式页面、界面重做、视觉评审、可访问性/断点 QA、组件设计，或希望降低网页的模板感与“AI 味”；不用于原生 App、纯平面海报或仅生成图片。
---

# Web UI Design Harness

把产品判断、视觉判断和工程验证分开记录。统一采用六阶段：**Discover → Define → Develop → Build → Critique → Deliver**。视觉分只描述截图可见质量，不替代交互、可访问性、性能或用户测试。

## 1. 选择任务模式

先声明模式；一个任务可组合模式，但要说明主模式。

| 模式 | 适用任务 | 阶段路径 |
|---|---|---|
| `CREATE` | 从需求创建 Web 页面/产品界面 | 全六阶段 |
| `REDESIGN` | 重做现有 Web UI | Discover（现状）→ Define → Develop → Build → Critique → Deliver |
| `CRITIQUE` | 只做截图视觉评审 | Discover（目标与证据）→ Define（评审边界）→ Critique → Deliver（报告） |
| `QA` | 只验证并报告现有实现 | Discover（范围）→ Define（矩阵）→ Build（仅测试夹具/环境准备）→ Critique（可选视觉检查）→ Deliver；不修改产品代码 |
| `COMPONENT` | 创建或重做 Web 组件 | Discover → Define → Develop（适用时）→ Build → Critique → Deliver |

不得为了“走全流程”制造无关工件。纯 `CRITIQUE` 和纯 `QA` 都只报告、不修改产品代码；若要根据结果修复，必须显式组合 `REDESIGN` / `COMPONENT`，或先取得修改授权。

## 2. Discover：收集现状与证据

先从上下文提取信息，只有分歧会导致不同成品时才问关键问题。写一行 Design Read：

> 这是一个面向【受众】的【Web 界面类型】，解决【核心任务】，采用【视觉语言】，优先保证【业务/体验约束】。

用 [`references/brief-template.md`](references/brief-template.md) 建立 brief，记录：

- 当前行为、可观察障碍、成功信号、替代方案、非目标。
- 已确认事实与假设；每条关键判断的证据来源和强度。
- 目标视口、输入方式、浏览器、技术栈、敏感/不可逆操作。
- 页面确实可能出现的内容与状态，不凭空假设全状态。

问题陈述应可验证：

> 【用户】在【情境】下无法顺利完成【任务】，因为【可观察障碍】；解决后应看到【成功信号】。

AI 可整理证据，不能把创作者直觉包装成用户研究。证据不足时明确标注假设。

## 3. Define：收敛问题、范围与验收

确认核心问题、关键任务、非目标和风险。定义：

- 信息架构、主要/次要任务、内容优先级。
- 目标断点与适用状态矩阵。
- 视觉验收、工程验收、用户/任务验证分别需要什么证据。

### 适用状态矩阵

按组件和用户路径判断状态是否适用，而不是强迫静态页面制造 loading/error。

| 对象/路径 | default | hover | focus | pressed | loading | empty | error | success | disabled | permission | 理由 |
|---|---|---|---|---|---|---|---|---|---|---|---|
| 【对象】 | 适用/不适用 | … | … | … | … | … | … | … | … | … | 【触发条件】 |

不适用写 `N/A` 并说明理由；适用但未检查写 `NOT TESTED`。

## 4. Develop：发散并建立设计身份

先探索方向，再选主线。方向数量由复杂度、风险和预算决定；**8–12 个方向只是复杂任务的启发式，不是配额**。每个方向至少在布局、密度、视觉媒介、交互隐喻中有两项实质不同。

资源允许且差异价值足够时，可并行尝试多个独立实例；**3–4 个实例只是启发式**。参考图数量同理，按同任务、同平台、同状态、相近内容密度选择，而非机械凑数。

需要打破模板化时，运行 `python3 scripts/create-design-seed.py`，或兼容入口 `scripts/create-design-seed.sh`。种子只扩大搜索空间，不保证质量，也不显示在产品中。

### 三个设计旋钮

使用 LOW/MEDIUM/HIGH，并写可观察锚点：

| 旋钮 | LOW | MEDIUM | HIGH |
|---|---|---|---|
| `DESIGN_VARIANCE` | 熟悉网格与控件，偏差很少 | 一处主构图或媒介突破，路径仍熟悉 | 多处非常规空间/媒介决策，仍守住任务可见性 |
| `MOTION_INTENSITY` | 仅状态反馈，reduced-motion 近静态 | 转场解释层级或因果 | 动效参与叙事/空间，但不承载唯一信息 |
| `VISUAL_DENSITY` | 单一主任务、大留白、少量并发信息 | 主次信息同时可扫读 | 高并发信息与紧凑控制，仍有分组和层级 |

若项目使用 1–10，仅视为团队内部 heuristic，必须附可观察锚点；不要默认 `8/6/4`。

选择方向后，用 [`references/design-identity-template.md`](references/design-identity-template.md) 固化视觉隐喻、token、布局、动效、允许冒险区和禁止项。用 [`references/directions-template.md`](references/directions-template.md) 记录比较；失败提示写入 [`references/prompt-graveyard-template.md`](references/prompt-graveyard-template.md)。

## 5. Build：分层实现

按以下顺序实现，减少装饰掩盖结构问题：

1. 真实或近真实内容与语义骨架。
2. 信息层级、布局、网格、目标断点。
3. 组件和适用状态矩阵中的状态。
4. 设计身份：字体、颜色、材质、图像。
5. 交互反馈、动效与 reduced-motion 降级。
6. 视觉资产、性能处理、代码整理。

核心文案由人审核；避免空洞的“赋能、解锁、重新定义”。表单保留可见 label；破坏性操作提供确认、撤销或明确后果。密钥只放受限且 gitignored 的本地配置。

## 6. Critique：视觉 Critic 与 Engineering QA 分轨

### 6.1 截图协议

截图前记录目标视口、device scale factor（DSF）、浏览器/引擎和页面状态。评审包至少包含：

- 首屏目标视口截图，观察任务与首屏构图。
- 全页截图，观察整体节奏。
- 关键局部裁剪，必要时放大 2–4 倍观察小字、焦点、边界和细节。

不要只给一张长图。验证 CSS 视口宽度、`scrollHeight`、截图像素尺寸与 DSF 的关系，并等待动画结束或启用 reduced-motion。

已验证示例是 Playwright 调用 system Chrome：

```bash
npx playwright screenshot --channel=chrome --viewport-size=390,844 --full-page --wait-for-timeout=1500 <url> out.png
```

这只是示例。没有 system Chrome 时，优先使用 Playwright bundled Chromium/Firefox/WebKit，或其他能设置**真实 CSS 视口并输出截图**的浏览器自动化工具；记录工具和版本。若只能文字代理评审，标注证据降级。

### 6.2 外发前隐私检查

发送给外部 Critic/模型前检查截图和上下文：移除真实姓名、头像、邮箱、电话、地址、客户/品牌机密、内部 URL、token、订单/财务/健康数据和浏览器个人信息。必要时用合成数据替换并复查裁剪区域。无法安全脱敏则不外发，改用本地评审或人工接管。

### 6.3 Visual Critic

使用 [`references/critic-prompt.md`](references/critic-prompt.md)。Critic 只给截图**可见**维度评分；交互行为、DOM 语义、键盘、读屏、性能、浏览器兼容等不可由截图证明的项目写 `N/A`，不进入视觉总分。

Critic 不因实现成本降低视觉标准；Orchestrator 对每条建议按 `impact / feasibility / risk / evidence` 仲裁，记录接受、拒绝或延期及理由。轮数上限是预算边界，不等于通过。

### 6.4 Engineering QA

使用 [`references/qa-template.md`](references/qa-template.md) 和 [`references/quality-rubric.md`](references/quality-rubric.md)。每项仅使用 `PASS / FAIL / N/A / NOT TESTED`，并附证据矩阵。静态视觉评分不能替代任务走查、用户测试、可访问性、性能或自动化检查。

## 7. 停止状态机

每轮必须以一个状态结束：

- `pass`：适用验收项有足够证据通过；已知风险已接受。
- `blocked`：缺输入、权限、环境或依赖；记录解除条件并停止自动循环。
- `plateau-visual`：连续轮次只有局部变化且核心视觉差距未缩小；回到 **Develop** 换方向/身份。
- `invalid-problem`：证据表明问题定义错误或任务无价值；回到 **Define**。
- `budget-exhausted`：达到预设轮数、时间、token 或费用预算但未通过；交给人工接管。

自动 Critic 轮数可按风险和预算设定；**3 轮只是常用 heuristic**。参考图数量、方向数、并行实例数、Critic token 占比也都是条件化 heuristic，不是质量保证或硬门槛。

## 8. Deliver：收敛、QA 与证据边界

先做 Subtraction Pass：只允许删除、合并、简化、弱化和重排。再做 AI Tells Audit，检查无意义渐变/glow、等宽卡片阵列、pill/圆角滥用、机械 hero 和空洞文案。

交付：

- 成品与运行说明。
- `brief.md`、`directions.md`、`design-identity.md`。
- `critic-log.md`：视觉证据、分数边界、建议仲裁与停止状态。
- `qa.md`：工程证据矩阵、任务走查/用户测试入口、未测项与风险。
- 适用时的 `prompt-graveyard.md`。

清楚区分：已观察、已测量、已自动验证、人工判断、假设、未测试。不要用“生产级”“完整交付”描述证据未覆盖的结果。

## 参考文件

- [`references/master-prompt.md`](references/master-prompt.md)：可复制的六阶段主控提示词。
- [`references/critic-prompt.md`](references/critic-prompt.md)：静态视觉评审协议。
- [`references/quality-rubric.md`](references/quality-rubric.md)：视觉与 QA 的边界及停止规则。
- [`references/source-notes.md`](references/source-notes.md)：来源与推演边界。
