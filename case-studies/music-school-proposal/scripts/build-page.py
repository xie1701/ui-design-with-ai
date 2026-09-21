#!/usr/bin/env python3
"""把提案 markdown 的文案注入手工编排的页面模板，生成单文件 index.html。

文案不手抄：全部来自 docs/copy-inventory.json（由 extract-copy.py 从源文档机器提取）。
模板里用 {{cNNN}} 占位；构建时替换为 <span data-copy="cNNN">…</span>，
以便验收脚本逐条比对渲染后的 DOM 文本。

构建即校验：
  - 有未使用的文案 id  -> 报错退出（防止文案漏进页面）
  - 出现未知占位符      -> 报错退出
  - 模板里残留 {{ }}    -> 报错退出

用法：python3 build-page.py <template.html> <inventory.json> <out.html>
"""
import html
import json
import re
import sys
from pathlib import Path

PLACEHOLDER = re.compile(r"\{\{(c\d{3})\}\}")
TITLE = re.compile(r'<h2 class="mv-title"><span data-copy="(c\d+)">(.*?)</span></h2>', re.S)


def tick_svg(text: str, bars: int = 28, w: int = 96, h: int = 14) -> str:
    """由章节标题文本确定性派生一段迷你声纹（镜像包络，和页面其他声纹同一视觉语言）。

    确定性：同一标题永远得到同一形状，不引入任何随机性。
    """
    seed = 2166136261
    for ch in text:
        seed ^= ord(ch)
        seed = (seed * 16777619) & 0xFFFFFFFF
    vals = []
    x = seed
    for _ in range(bars):
        x = (x * 1103515245 + 12345) & 0x7FFFFFFF
        vals.append(2.0 + (x % 1000) / 1000.0 * (h - 4.0))
    step = w / (bars - 1)
    top = [f"{i * step:.1f},{h / 2 - v / 2:.1f}" for i, v in enumerate(vals)]
    bot = [f"{i * step:.1f},{h / 2 + v / 2:.1f}" for i, v in reversed(list(enumerate(vals)))]
    d = "M" + "L".join(top) + "L" + "L".join(bot) + "Z"
    return (f'<svg viewBox="0 0 {w} {h}" width="{w}" height="{h}" aria-hidden="true">'
            f'<path d="{d}" fill="currentColor"/></svg>')


def add_chapter_tick(m):
    cid, inner = m.group(1), m.group(2)
    plain = re.sub(r"<[^>]+>", "", inner)
    return (f'<span class="chTick" aria-hidden="true">{tick_svg(plain)}</span>'
            f'<h2 class="mv-title"><span data-copy="{cid}">{inner}</span></h2>')


def inline_html(text: str) -> str:
    """markdown 行内语法 -> HTML。只处理语法标记，不改动任何文字。"""
    s = text
    # markdown 转义（源文档有 2 处 \*\*，按作者本意还原为强调）
    s = re.sub(r"\\([*_`~])", r"\1", s)
    s = html.escape(s, quote=False)
    s = re.sub(r"\*\*(.+?)\*\*", r"<strong>\1</strong>", s)
    s = re.sub(r"(?<!\*)\*(?!\*)(.+?)(?<!\*)\*(?!\*)", r"<em>\1</em>", s)
    s = re.sub(r"`(.+?)`", r"<code>\1</code>", s)
    return s


def main():
    template_path, inventory_path, out_path = (Path(a) for a in sys.argv[1:4])
    inventory = json.loads(inventory_path.read_text(encoding="utf-8"))
    by_id = {e["id"]: e for e in inventory["entries"]}
    template = template_path.read_text(encoding="utf-8")

    used = []
    unknown = []

    def replace(m):
        cid = m.group(1)
        if cid not in by_id:
            unknown.append(cid)
            return m.group(0)
        used.append(cid)
        return f'<span data-copy="{cid}">{inline_html(by_id[cid]["text"])}</span>'

    out = PLACEHOLDER.sub(replace, template)
    # 每个章节标题前加一段由该标题文本派生的迷你声纹：中后段长文需要“换气”，
    # 也给每一章一个可辨认的视觉起点（纯装饰，aria-hidden，不进可访问性树）。
    ticks = len(TITLE.findall(out))
    out = TITLE.sub(add_chapter_tick, out)

    problems = []
    if unknown:
        problems.append(f"未知占位符：{sorted(set(unknown))}")
    missing = [cid for cid in by_id if cid not in used]
    if missing:
        problems.append(f"文案未进页面（{len(missing)} 条）：{missing}")
    dupes = sorted({cid for cid in used if used.count(cid) > 1})
    if dupes:
        problems.append(f"同一文案被用多次：{dupes}")
    leftover = re.findall(r"\{\{[^}]*\}\}", out)
    if leftover:
        problems.append(f"模板残留占位符：{leftover}")

    if problems:
        print("=== 构建失败 ===")
        for p in problems:
            print(" -", p)
        sys.exit(1)

    out_path.write_text(out, encoding="utf-8")
    print("=== 构建通过 ===")
    print(f"文案注入：{len(used)}/{len(by_id)} 条，全部命中")
    print(f"章节声纹刻度：{ticks} 处")
    print(f"输出：{out_path}  {out_path.stat().st_size} bytes")


if __name__ == "__main__":
    main()
