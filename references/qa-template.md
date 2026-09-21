# Engineering QA 模板

只使用 `PASS / FAIL / N/A / NOT TESTED`。截图视觉分不能替代本表证据。

## 环境
- 日期：
- 执行者：
- commit/build：
- 浏览器/版本：
- 操作系统/设备：
- CSS 视口与 DSF：
- 测试数据是否脱敏：

## 适用状态矩阵

| 对象/路径 | default | hover | focus | pressed | loading | empty | error | success | disabled | permission | 理由 |
|---|---|---|---|---|---|---|---|---|---|---|---|
| | | | | | | | | | | | |

## 证据矩阵

| 项目 | 适用性 | 方法/环境 | 结果 | 证据位置 | 执行者/日期 | 备注/阻断级别 |
|---|---|---|---|---|---|---|
| 首屏主要任务 | | 目标视口截图+任务走查 | NOT TESTED | | | |
| 320px/目标移动/桌面 | | Playwright/真机 | NOT TESTED | | | |
| 长文案与极端数据 | | fixture/手工 | NOT TESTED | | | |
| 键盘与 focus-visible | | 全路径键盘走查 | NOT TESTED | | | |
| 语义 HTML/label/错误关联 | | DOM/a11y tree | NOT TESTED | | | |
| 屏幕阅读器关键路径 | | VoiceOver/NVDA | NOT TESTED | | | |
| 文本/控件/焦点对比度 | | token 计算/取样 | NOT TESTED | | | |
| reduced-motion | | 媒体查询/录屏 | NOT TESTED | | | |
| 状态与错误恢复 | | 状态矩阵逐项 | NOT TESTED | | | |
| lint/typecheck/build | | 命令输出 | NOT TESTED | | | |
| 关键路径自动化 | | 测试命令 | NOT TESTED | | | |
| 性能预算 | | Lighthouse/trace/自定指标 | NOT TESTED | | | |
| 目标浏览器 | | 实机/云设备 | NOT TESTED | | | |
| 资产 fallback/授权/密钥 | | 文件与网络检查 | NOT TESTED | | | |

## 任务走查 / 用户测试
- 目标任务：
- 参与者/样本（未做写 NOT TESTED）：
- 成功定义：
- 结果与观察：
- 证据位置：
- 结论边界：

## 交付结论
- 阻断项：
- NOT TESTED 项：
- 已接受风险与确认人：
- 最终状态：pass / blocked / plateau-visual / invalid-problem / budget-exhausted
- 纯 QA 通常不使用 `plateau-visual`；若证据表明问题定义错误，仍可使用 `invalid-problem`。
