# 一起共创

这套 Harness 的价值取决于它被用在多少种真实的页面上。一个人的案例跑不出通用规则，十个不同行业的页面才可以。

你不需要先成为设计专家才能贡献——**按流程跑一遍、如实记录跑到哪一步，本身就是有价值的贡献。**

## 四类我最想要的东西

### 1. 带证据的实战案例

你用这套流程跑了什么页面、跑到哪一步、结果如何。

**失败案例和成功案例一样有价值，甚至更有。** 一个「跑完六阶段分数还是没上去」的记录，比又一个 9 分案例更能暴露规则的问题——它可能说明方向发散不够、可能说明 Critic 的评分维度选错了、也可能说明这个任务本来就不该用这套流程。

案例需要这几份文档，直接照 `references/` 里的模板抄：

| 文档 | 模板 |
|---|---|
| brief（需求与证据） | [brief-template.md](references/brief-template.md) |
| directions（方向发散） | [directions-template.md](references/directions-template.md) |
| design-identity（设计身份） | [design-identity-template.md](references/design-identity-template.md) |
| critic-log（评审记录） | [critic-log-template.md](references/critic-log-template.md) |
| qa（工程验收） | [qa-template.md](references/qa-template.md) |
| prompt-graveyard（失效写法） | [prompt-graveyard-template.md](references/prompt-graveyard-template.md) |

放在 `case-studies/<你的案例名>/` 下，截图放同目录的 `shots/`。

### 2. 失效的规则

哪条启发式在你的场景里明显不成立？直接丢进 prompt graveyard，附上你踩坑的现场。

比如「方向数越多越好」「并行实例越多越好」「评分线到了就可以收工」——这类默认值在不同项目里会以不同方式失效，我需要知道它们具体是怎么失效的。

### 3. 设计判断规则

**「什么时候该打破哪条规则」——这是目前最难自动化的部分，也是我最缺的。**

如果你在某个场景下做了反直觉但正确的判断（比如「这里就该用居中对称」「这里文字就该小于 16px」），把它写成一条可复用的规则，说明触发条件、反例和代价。

### 4. 复现失败报告

按 README 的安装步骤跑不起来、脚本报错、文档自相矛盾、链接失效——都请直接开 Issue。这类报告不需要任何设计能力，但对别人最有用。

## 提之前请守住三条

这是这个仓库唯一的门槛：

1. **结论先行，附证据。** 命令、截图、原始输出。不要只给结论——「评审给了 8 分」不如「评审给了 8 分，原始输出在 `critic-log.md`，截图在 `shots/r2/`」。
2. **写明边界。** 哪些测了、哪些没测。`NOT TESTED` 比编一个「通过」有价值得多。如果某项你没测，写清楚就行，不会因此被拒。
3. **涉及真实数据就先脱敏。** 人名、家庭结构、户型、作息、预算、品牌信息、备案号、二维码——要么脱敏，要么明确标注为合成数据。案例里的人物和数字默认应视为合成。

## 怎么提

- **想法、问题、复现失败**：开 [Issue](https://github.com/xie1701/ui-design-with-ai/issues)。
- **案例、规则、文档修正**：直接 PR。
- **采纳的案例会带你的署名留在仓库里。**

PR 之前建议本地过一遍：

```bash
# 文档里的相对链接都指向真实文件
grep -oE '\]\([^)]+\)' README.md CONTRIBUTING.md | sort -u

# 没有本机绝对路径泄漏
grep -rnE '/Users/|/tmp/' --include='*.md' --include='*.html' .
```

## 关于评审意见

这个仓库对「高分」的态度比较克制：自动评审轮数只是预算上限，不等于通过；视觉分只覆盖截图看得见的部分。

所以如果你的 PR 带着一个不高的分数进来，那是完全可以的——**我更想知道分数为什么不高，而不是想办法把分数调上去。**
