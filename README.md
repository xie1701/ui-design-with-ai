# ui-design-with-ai

一套面向 **Web UI** 的 AI 设计与验证 Harness：把需求定义、视觉发散、实现、静态视觉评审和工程 QA 分开记录，减少模板化输出与“高分等于已验收”的误判。

> Discover → Define → Develop → Build → Critique → Deliver

它更适合被理解为一套可复用工作流，而不是“神级提示词”。目前证据表明它能帮助操作者系统化探索与复核；尚没有多任务、多名新手的对照实验，因此不宣称已经证明“稳定产出顶级 UI”。

## 能做什么

- `CREATE`：从需求创建 Web 页面或 Web app 界面
- `REDESIGN`：重做现有网页
- `CRITIQUE`：只做静态视觉评审
- `QA`：验证交互、响应式、无障碍和工程质量
- `COMPONENT`：创建或重做 Web 组件与适用状态

不用于原生 iOS/Android App、纯平面海报或仅生成图片。

## 核心边界

- **Visual Critic** 只评价截图可见的任务线索、层级、构图、设计身份与细节；截图不能证明的交互、键盘、读屏、性能等一律 `N/A`，不进入视觉总分。
- **Engineering QA** 只使用 `PASS / FAIL / N/A / NOT TESTED` 和证据矩阵。
- 自动评审轮数只是预算上限，不等于通过。
- 方向数、并行实例、参考图数量、设计旋钮与评分线都是可调整 heuristic，不是质量保证。

## 文件结构

```text
ui-design-with-ai/
├── SKILL.md
├── references/
│   ├── master-prompt.md
│   ├── brief-template.md
│   ├── directions-template.md
│   ├── design-identity-template.md
│   ├── critic-prompt.md
│   ├── critic-log-template.md
│   ├── quality-rubric.md
│   ├── qa-template.md
│   ├── prompt-graveyard-template.md
│   └── source-notes.md
├── scripts/
│   ├── create-design-seed.py
│   └── create-design-seed.sh
├── examples/
└── case-studies/
    ├── owner-side/
    └── shengyi-next-landing/   # 含可拖动的前后对比页 compare.html
```

仓库根目录就是 Skill 根目录，`SKILL.md` 不再嵌套一层。

## 安装

### Agent Skills 目录

以 Claude Code 为例：

```bash
mkdir -p ~/.claude/skills

git clone https://github.com/xie1701/ui-design-with-ai.git \
  ~/.claude/skills/ui-design-with-ai

test -f ~/.claude/skills/ui-design-with-ai/SKILL.md
```

其他支持 Agent Skills 的工具，把仓库 clone 到其 skills 目录下的 `ui-design-with-ai/` 即可。

### Cola 本地开发

```bash
mkdir -p ~/code ~/.cola/skills
git clone https://github.com/xie1701/ui-design-with-ai.git ~/code/ui-design-with-ai
ln -s ~/code/ui-design-with-ai ~/.cola/skills/ui-design-with-ai
```

### 任意聊天工具

1. 打开 [主控提示词](references/master-prompt.md)，贴入新对话。
2. 按任务选择 CREATE / REDESIGN / CRITIQUE / QA / COMPONENT。
3. Visual Critic 使用[独立评审协议](references/critic-prompt.md)，最好放在不含实现历史的新对话。
4. 工程验收使用 [QA 模板](references/qa-template.md)，不要用视觉分代替验证。

## 截图协议

评审包至少包含：首屏目标视口、全页图、关键局部裁剪。记录 CSS 视口、device scale factor、浏览器/引擎和页面状态；外发前先脱敏。

已验证过的一种命令是使用本机 Chrome：

```bash
npx playwright screenshot --channel=chrome \
  --viewport-size=390,844 --full-page --wait-for-timeout=1500 \
  <url> out.png
```

这不是唯一方案。没有 system Chrome 时可使用 Playwright bundled Chromium/Firefox/WebKit，或其他能设置真实 CSS 视口并输出截图的工具；应记录工具与版本，并核对 CSS viewport、截图像素尺寸和 DSF。

## 案例与证据边界

| 案例 | 单模型静态视觉评审 | 可以说明什么 | 不能说明什么 |
|---|---:|---|---|
| [业主端](examples/owner-side/index.html) | 9.3/10 | 当时截图上的设计身份和可见层级得到认可 | 不代表屏幕阅读器、性能、真机或用户任务通过 |
| [设计师端](examples/designer-side/index.html) | 9.0/10 | 当时截图上的档案视觉方向得到认可 | 不代表生产级整体质量或跨模型稳定性 |
| [生意说首页互动化](case-studies/shengyi-next-landing/README.md) | 5.0 → 6.6 | 在已上线产品上跑完六阶段：把「只有确认才继续」从文字声明改成可亲手操作的结构；工程 QA 阻断项 0 | 不代表转化更好、真机通过或读屏可用；改动未提交未部署 |

完整限制见[公开案例证据包](case-studies/owner-side/README.md)与[生意说首页案例](case-studies/shengyi-next-landing/README.md)。案例中的人物、家庭结构、户型、作息和预算均为合成演示数据；证据包保留 brief、方向、identity、评审记录和 QA，但模型精确版本、完整 token/耗时和真实用户测试未记录，不得据此宣称“小白稳定复现”。

生意说案例还附一个[可拖动的前后对比页](case-studies/shengyi-next-landing/compare.html)。

## 依赖

- Skill 文档本身无平台专有依赖。
- 设计种子优先使用 Python 3：`python3 scripts/create-design-seed.py`。
- `scripts/create-design-seed.sh` 是兼容入口：优先调用 Python 3；缺少 Python 时在有 `/dev/urandom` 的 Unix 环境回退。
- 截图和 QA 工具按项目环境选择，Playwright 只是示例。

## 来源

方法来源与哪些内容属于工程化推演，见 [source notes](references/source-notes.md)。

## License

MIT
