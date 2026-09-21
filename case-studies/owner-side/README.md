# 匿名化案例：住宅需求沟通工具业主端

这是一次真实流程的匿名化记录，用于展示 Skill 如何发散、收敛、复核和记录风险。它不是受控实验，也不能单独证明跨项目或新手使用的稳定性。

## 范围

- 日期：2026-09-20
- 任务：重做一个面向装修业主的 Web 首页
- 实现：单页 HTML/CSS/JavaScript
- 评审：独立模型静态截图评审；模型具体版本未记录（`NOT RECORDED`）
- 工程检查：DOM/脚本/多视口截图；不是完整生产认证

## 工件

- [Brief](brief.md)
- [Directions](directions.md)
- [Design identity](design-identity.md)
- [Critic log](critic-log.md)
- [QA](qa.md)
- [最终实现](../../examples/owner-side/index.html)
- [桌面截图](../../examples/owner-side/screenshots/creative-desktop.png)
- [移动截图](../../examples/owner-side/screenshots/creative-mobile.png)

## 结果边界

最终 `9.3/10` 是单一独立模型对静态截图给出的视觉分，仅说明当时评审认为设计身份、首屏任务和可见移动布局成立。它不证明：

- 屏幕阅读器兼容；
- 320px 与真实微信内核；
- canvas 的低端设备性能；
- 用户是否更快完成真实任务；
- 其他操作者或模型可以稳定复现同样结果。

完整复跑还需要固定模型/版本、提示词、每轮原始截图、耗时/token、自动化命令和真实用户任务结果；这些在本次执行中没有完整记录，统一标记为 `NOT RECORDED` 或 `NOT TESTED`，不补写猜测。
