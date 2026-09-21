# Source Notes：来源、推演与证据边界

本文件记录方法来源，不把外部文章或单次案例包装成普遍定律。公开仓库不包含受版权限制的视频转录；其中结论来自当时的人工回看与分段 ASR，使用时需回到原始材料复核。

## 主要来源

1. **Anshu Chimala — How to turn your AI into a world-class designer**
   https://www.lennysnewsletter.com/p/how-to-turn-your-ai-into-a-world
   - 模型默认输出趋向高概率、安全选择，容易形成 design-by-committee。
   - 先广后深；用外部输入、具体视觉隐喻和独立 Critic 扩大并收敛设计空间。
   - 评审角色与实现角色隔离；最后做减法。

2. **内部附件视频观察（不可由公开仓库独立复核）**
   - 文件标题：`如何使用 AI 做出顶级的 UI 设计 - 001 - 如何使用 AI 做出顶级的 UI 设计.mp4`
   - 时长约 26 分 49 秒；作者、公开发布日期与稳定 URL 未记录，分析日期为 2026-09-20。
   - 以下内容来自当时的人工回看与分段 ASR，只作为辅助观察，不单独构成规范依据；公开读者应以其余可访问来源和项目实证为准。
   - 强调完整 Double Diamond：Discover → Define → Develop → Deliver。
   - “拍照识别热量”等功能只是解法假设，不能直接等同用户需求。
   - 随机字符串只是发散工具，明确的多维约束通常更重要。
   - AI 文案需人工重写；图像、shader、3D、视频应服务任务并接受性能/降级检查。

3. **永燃的思维火花 · Jerold — 如何让 AI 做出世界级的 UI 设计**
   https://mp.weixin.qq.com/s/DAC9i5BwNcnHCa-_DNh3DA
   - Subtraction Pass、AI Tells Audit、Visual Loss Function 与 Harness Engineering。
   - 这些包含作者对原文的工程化延伸；引用时不冒充原文原句。

4. **Nielsen Norman Group — 10 Usability Heuristics**
   https://www.nngroup.com/articles/ten-usability-heuristics/

5. **Nielsen Norman Group — Using AI for UX: Study Guide**
   https://www.nngroup.com/articles/ai-work-study-guide/

6. **W3C — WCAG 2.2**
   https://www.w3.org/TR/WCAG22/

7. **Apple Human Interface Guidelines**（持续更新；访问于 2026-09-20）
   https://developer.apple.com/design/human-interface-guidelines/
   - 仅在 Apple 平台相邻语境中参考布局、字体、材料、动效与无障碍原则；不把 “Apple-like” 当作视觉滤镜。

8. **Material Design 3 — Foundations**（持续更新；访问于 2026-09-20）
   https://m3.material.io/foundations
   - 用于 Material 语境中的结构、排版、颜色、状态与无障碍基础；不与其他设计系统随意混用。

9. **Figma Design Team — From Figma's design team: How to run a design critique**（访问于 2026-09-21）
   https://www.figma.com/blog/design-critiques-at-figma/
   - 支撑“先对齐评审目标、提供项目语境、收集具体且可行动反馈、记录后续行动”的 Critique 工作方式；不支撑视觉分数的客观性。

## 从来源推演出的工作机制

以下是本 Skill 的工程化推演，不是所有来源的原话：

- 三种设计旋钮，用可观察 LOW/MEDIUM/HIGH 锚点代替伪精确默认分。
- 并行独立实例、方向数量、参考图数量与 Critic 预算都属于条件化 heuristic。
- `prompt-graveyard.md` 记录失败提示词，在模型能力变化后重测。
- Visual Critic 与 Engineering QA 分轨；静态截图不可证明的项目必须 N/A。
- Orchestrator 按 impact / feasibility / risk / evidence 仲裁 Critic 建议。
- 统一停止状态机，而不是把“三轮”或“9 分”当作客观通过线。

## 端到端实跑沉淀

一次 Web 首页实跑暴露并已写回以下规则：

1. **真视口截图**：某次 macOS Chrome headless 运行中，请求 390px 的 window-size 实际按更宽布局渲染。现在要求读取 CSS viewport、记录 DSF，并将 Playwright system Chrome 仅作为已验证示例，而非平台唯一方案。
2. **动画伪影**：入场动画中间帧被误判为残影和低对比度。现在要求等待动画完成或启用 reduced-motion。
3. **长图漏判**：视觉模型会漏掉长截图小细节。现在要求首屏、全页和局部裁剪组成评审包，局部放大 2–4 倍。
4. **评审事实误判**：Critic 曾误读颜色、裁切和空白尺寸。现在要求用 DOM 度量、像素取样或局部截图复核事实陈述。
5. **资源条件**：多实例发散只在资源允许且差异价值足够时使用，单会话文字发散不应阻塞流程。

公开案例证据位于 [`../case-studies/owner-side/`](../case-studies/owner-side/)。其中人物与数值为合成演示数据；它展示一次流程如何执行，不足以证明跨项目、跨操作者或“小白稳定产出”。

## 谨慎结论

- 随机种子扩大探索，不保证美感。
- 单次模型 9.x 分只是当时截图上的视觉判断，不是生产认证。
- 参考图排序受样本选择和模型波动影响，只用于提出改进假设。
- 真实任务成功、无障碍、性能和维护质量必须分别验证。
- 当前案例没有构成多名新手、多任务、固定协议的对照实验，因此不宣称稳定性已被证明。
