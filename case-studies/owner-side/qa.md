# Engineering QA — 匿名化案例

本文件已按当前 QA 协议迁移。历史执行没有保存命令、原始输出、浏览器版本、执行者和完整证据位置的项目，不追认 `PASS`，统一标为 `NOT TESTED`。

## 环境
- 日期：2026-09-20
- 执行者：`NOT RECORDED`
- commit/build：`NOT RECORDED`
- 浏览器/版本：系统 Chrome；精确版本 `NOT RECORDED`
- 视口记录：390px 与 1440px；DSF `NOT RECORDED`
- 数据：示例人物、家庭结构、户型、作息和预算均为合成演示数据，不对应真实家庭

## 适用状态矩阵

| 对象/路径 | default | hover | focus | pressed | loading | empty | error | success | disabled | permission | 理由 |
|---|---|---|---|---|---|---|---|---|---|---|---|
| 案例首页 | 适用 | 适用 | 适用 | 适用 | N/A | N/A | N/A | N/A | N/A | N/A | 静态展示页，无远程数据与权限流程 |
| 复制介绍 | 适用 | 适用 | 适用 | 适用 | N/A | N/A | 适用 | 适用 | N/A | N/A | Clipboard API 可成功或失败 |
| 档案 Tab | 适用 | 适用 | 适用 | 适用 | N/A | N/A | N/A | N/A | N/A | N/A | 本地内容切换 |

## 证据矩阵

| 项目 | 适用性 | 方法/环境 | 结果 | 公开证据 | 执行者/日期 | 备注 |
|---|---|---|---|---|---|---|
| 视觉身份 | 适用 | 单模型静态截图评审 | PASS | [`critic-log.md`](critic-log.md) 与最终截图 | 未记录 / 2026-09-20 | 仅代表当次模型视觉判断 |
| 最终截图尺寸 | 适用 | 历史截图文件像素 | PASS | [`creative-mobile.png`](../../examples/owner-side/screenshots/creative-mobile.png)、[`creative-desktop.png`](../../examples/owner-side/screenshots/creative-desktop.png) | 未记录 / 2026-09-20 | 可由文件复核像素尺寸 |
| CSS viewport 与 scrollWidth | 适用 | 历史 DOM 脚本 | NOT TESTED | 原始命令和输出未保存 | 未记录 | 不根据文字回忆追认 PASS |
| 3D 外接框修复 | 适用 | 历史前后截图/DOM 检查 | NOT TESTED | 前图与原始输出未公开 | 未记录 | 只能确认最终移动图宽度 |
| Owner 冲突标签 | 适用 | 历史 DOM 脚本 | NOT TESTED | 原始命令和输出未保存 | 未记录 | 代码存在不等于行为已复核 |
| Owner 复制成功/失败 | 适用 | 历史交互检查 | NOT TESTED | 原始命令和输出未保存 | 未记录 | 需重新走查权限失败路径 |
| reduced-motion | 适用 | 代码/运行时检查 | NOT TESTED | 未保存运行时证据 | 未记录 | |
| Designer Tab 与键盘方向键 | 适用 | 历史 DOM 脚本 | NOT TESTED | 原始命令和输出未保存 | 未记录 | |
| FAQ 原生语义 | 适用 | DOM 检查 | NOT TESTED | 未保存 accessibility tree | 未记录 | |
| 320px / 真机微信内核 | 适用 | 真机/模拟器 | NOT TESTED | 无 | — | |
| 屏幕阅读器关键路径 | 适用 | VoiceOver/NVDA | NOT TESTED | 无 | — | |
| canvas 低端设备性能 | 适用 | trace/性能预算 | NOT TESTED | 无 | — | |
| 真实用户任务成功率 | 适用 | 任务走查/用户测试 | NOT TESTED | 无 | — | |

## Creative review history
- 模型/精确版本：`NOT RECORDED`。
- R1：Owner 5.0 / Designer 6.5；主要指出旧视觉语法与 SaaS 三卡结构。
- 修改后 R2：Owner 9.3 / Designer 9.0，视觉评审认为截图中的身份、层级和移动布局成立。
- 分数只覆盖截图可见质量，不代表 Engineering QA 或生产认证。

## 任务走查 / 用户测试
- 参与者与样本：`NOT TESTED`
- 任务成功标准：`NOT RECORDED`
- 结果：`NOT TESTED`

## 交付结论
- 阻断项：公开证据不足以确认交互、可访问性、性能和真机表现。
- 已确认：最终工件存在，截图像素和静态视觉记录可复核。
- 最终状态：`budget-exhausted`。历史执行已经结束，但适用项目仍有 `NOT TESTED`，不得标记 `pass`。
