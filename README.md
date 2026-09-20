# ui-design-with-ai

**用 AI 稳定产出顶级 UI 设计的可复用生产系统** · A reusable harness for producing top-tier UI design with AI.

这不是一个"生成一张好看的页面"的提示词，而是一套完整的生产流程（Harness）：

> 先确认真正的问题 → 扩大解法空间 → 建立设计身份 → 独立评审闭环 → 工程验收交付。

核心信念：**Prompt 只解决一次任务，流程解决以后所有任务。** 你（或 AI）的任务不是替模型审美，而是把产品判断、审美判断和质量标准变成可观察、可比较、可迭代的决策。

## 为什么不是又一个"神级提示词"

大多数 AI 设计提示词产出的是"平均水平的漂亮"——模板感、渐变 hero、无意义装饰。这套系统的不同：

- **完整 Double Diamond 四阶段**：Discover（发现真实问题）→ Define（定义核心问题）→ Develop（12 方向发散）→ Deliver（收敛交付）。"解法≠需求"——用户说"记下我每天吃了什么"时，真正的问题是"记下来太麻烦"。
- **三个设计旋钮**：DESIGN_VARIANCE / MOTION_INTENSITY / VISUAL_DENSITY，把"风格"变成可调参数。
- **设计身份**：每次设计必须有一句可以说服设计师的"为什么长这样"，而不是 token 拼贴。
- **独立 Critic 评审闭环**：隔离上下文、统一 rubric、维度打分、最多 3 轮自动迭代、停止线机制。
- **禁用词表**：现代 / 美观 / 简洁 / 高端 / 大气 / 赋能 / 解锁 / 重新定义——这些词没有设计信息。
- **截图管线四查**：评审截图本身可能是错的（视口污染、动画伪影），先验证管线再评审。

## 实战验证

本仓库的 `examples/` 是两次端到端实跑的完整交付（不是 toy demo）：

| 案例 | 评审轨迹 | 说明 |
|---|---|---|
| [业主端首页](examples/owner-side/index.html) | 6.5 → 7.5* → 7 → **8.0 确证收敛**（*前两轮受截图管线污染） | 「贴满便签的家」身份：内联 SVG 户型图 + 业主原话便签 |
| [设计师端首页](examples/designer-side/index.html) | 7.5 → **8.0 收敛** | 「收到的档案」身份：索引标签 + 装订卡 + 红章 |

两次实跑共产生 11 条评审改动，经 DOM 度量/像素计算抽查后改判 3 条、修复全部真问题——评审意见要抽查，这条教训已写进协议。

## 文件结构

```
ui-design-with-ai/
├── SKILL.md                      # 六阶段总控流程（核心，270 行）
├── references/
│   ├── master-prompt.md          # 任意聊天工具可手贴的六阶段模板
│   ├── critic-prompt.md          # 独立评审协议
│   ├── quality-rubric.md         # 六维度评分 rubric
│   ├── brief-template.md         # 需求简报模板
│   └── source-notes.md           # 方法出处与实战回修记录
└── scripts/
    └── create-design-seed.sh     # 设计种子生成（16–4096 位）
```

## 怎么用

### 方式一：支持 Agent Skills 规范的工具（Claude Code / Claude Desktop 等）

```bash
git clone https://github.com/xie1701/ui-design-with-ai.git
mkdir -p ~/.claude/skills
cp -R ui-design-with-ai ~/.claude/skills/
```

然后对 agent 说：**"用 ui-design-with-ai 给 XX 做个落地页"**，六阶段流程自动接管。

### 方式二：任意聊天工具（ChatGPT / Kimi / 豆包……零安装）

1. 打开 `references/master-prompt.md`，整份贴到对话开头
2. 按六阶段走：贴需求 → 发散 12 方向 → 选方向定身份 → 实现
3. **关键一步**：把实现截图发给一个**全新的对话**当 Critic（评审者不能看过实现过程），配合 `references/critic-prompt.md` 打分
4. 按分数迭代，最多 3 轮，然后停

### 方式三：当方法论文档读（给人类设计师）

SKILL.md 的每一节都是可独立摘用的 checklist：四阶段流程、三旋钮、禁用词表、组件状态清单、动效三问、截图管线四查、评审协议、减法审查。

## 评审前必须过的截图管线四查

评审截图是 Critic 的唯一感官，管线失真会让评审"确认"不存在的 bug（我们实测中 Chrome headless 把 390px 视口按 756px 布局渲染，两轮评审基于失真输入）：

1. **视口宽度 = 目标宽度**——不信任 headless 浏览器的 window-size，用 `npx playwright screenshot --channel=chrome --viewport-size=390,844 --full-page --wait-for-timeout=1500 <url> out.png`
2. **整页高度 = scrollHeight**——固定高窗口截图会产生画布余白
3. **像素宽 = 视口宽**——sips/ffprobe 核对
4. **动画已完成**——半透明中间帧会被当成"渲染故障"

## 出处

方法体系从三个来源交叉校准：Anshu Chimala 的 [How to turn your AI into a world-class UI designer](https://www.lennysnewsletter.com/p/how-to-turn-your-ai-into-a-world)（Lenny's Newsletter）+ 同主题视频逐帧转录（9,685 字）+ 实践者公众号文章的收敛审查技法，并经两次真实产品端到端实跑回修。

## License

MIT
