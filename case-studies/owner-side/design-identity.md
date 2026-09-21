# Design Identity — 两页重做

## Owner / 生活现场的编辑桌
- `DESIGN_VARIANCE=HIGH`：多处非常规编辑式空间关系，但主任务保持可见。
- `MOTION_INTENSITY=HIGH`：动效参与空间叙事，不承载唯一信息。
- `VISUAL_DENSITY=MEDIUM`：主次信息可并行扫读，保持明确分组。
- 色彩：骨白 `#EAE5DB`、煤黑 `#171817`、朱砂 `#D8523A`、酸橙 `#D5EF63`、墨绿 `#1E3A32`。
- 字体：标题 `Iowan Old Style / Songti SC`，正文 `Avenir Next / PingFang SC`，索引用窄体大写。
- 构图：左侧巨大标题纵向切入；右侧“生活切片”用 CSS 3D perspective 倾斜；内容按编辑标记散落在轴线旁，不组成卡片阵列。
- 动效：`canvas#room-scan` 仅作可解释的房间轮廓扫描；鼠标改变扫描偏移，不改变信息布局。纸张入场用 transform+opacity。reduced-motion 禁用 canvas 动画。
- 禁止：蓝图 SVG 主视觉、黄色便签、默认 hero 卡片；这些属于旧版身份。

## Designer / 档案收藏室
- `DESIGN_VARIANCE=HIGH`：档案索引、错位纸层构成主要空间语言。
- `MOTION_INTENSITY=MEDIUM`：切换和 hover 解释层级，不自动翻页。
- `VISUAL_DENSITY=MEDIUM`：档案信息并行可扫读，移动端恢复单列。
- 色彩：近黑紫 `#211D2B`、骨白 `#F0E9DC`、氧化绿 `#9DB7A1`、纸黄 `#E9D8A5`、校样红 `#E16953`。
- 字体：标题 `Baskerville / Songti SC`，正文 `Avenir Next / PingFang SC`，索引 `Courier New` 仅用于少量档案编号（不作正文）。
- 构图：悬浮侧边索引 + 巨大编号 01；首屏档案页错位叠放，内容层通过真实 tab 切换；桌面纸层重叠，移动端恢复单列。
- 动效：点击档案标签切换内容；hover 只改变纸层 translate/rotate；不自动翻页，避免产品信息被动消失。reduced-motion 仍可点击切换但无位移动画。
- 禁止：对称三卡、浅色 SaaS dashboard、蓝图语言、把交易转化作为核心价值。
