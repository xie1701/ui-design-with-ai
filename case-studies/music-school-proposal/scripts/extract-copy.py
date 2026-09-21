#!/usr/bin/env python3
"""从源提案 markdown 提取「文案清单」，作为页面文案的唯一来源与验收基准。

用法：
  python3 extract-copy.py <source.md> <out-dir>

产物：
  copy-inventory.json   每条文案的 id / 类型 / 层级 / 归一化文本
  copy-sheet.md         人工抄写用的逐条清单（含原文与归一化文本）

归一化规则（仅处理 markdown 语法，不改动文字本身）：
  1. 去掉行首列表符号、引用符号、表格竖线
  2. 解开 markdown 转义：\\* -> *
  3. 去掉强调/代码标记：** * `
  4. 链接 [文字](地址) -> 文字
  5. 连续空白折叠为单个空格
文字内容（含中英文标点、全角空格）一律原样保留。
"""
import json
import re
import sys
from pathlib import Path


def normalize(text: str) -> str:
    s = text.strip()
    s = re.sub(r"\\([*_`~])", r"\1", s)
    s = re.sub(r"\[([^\]]*)\]\([^)]*\)", r"\1", s)
    s = s.replace("**", "").replace("*", "").replace("`", "")
    s = re.sub(r"\s+", " ", s)
    return s.strip()


def parse(md: str):
    """按行解析，产出结构化块序列。"""
    lines = md.split("\n")
    blocks = []
    i = 0
    n = len(lines)
    while i < n:
        raw = lines[i]
        line = raw.strip()

        if not line:
            i += 1
            continue
        if line in ("---", "***", "___"):
            blocks.append({"kind": "rule", "raw": ""})
            i += 1
            continue

        m = re.match(r"^(#{1,6})\s+(.*)$", line)
        if m:
            blocks.append({"kind": "heading", "level": len(m.group(1)), "raw": m.group(2)})
            i += 1
            continue

        if line.startswith("|"):
            rows = []
            while i < n and lines[i].strip().startswith("|"):
                cells = [c.strip() for c in lines[i].strip().strip("|").split("|")]
                if not all(re.fullmatch(r":?-{2,}:?", c) for c in cells):
                    rows.append(cells)
                i += 1
            blocks.append({"kind": "table", "rows": rows})
            continue

        if line.startswith(">"):
            items = []
            while i < n and lines[i].strip().startswith(">"):
                items.append(lines[i].strip().lstrip(">").strip())
                i += 1
            blocks.append({"kind": "quote", "items": [x for x in items if x != ""]})
            continue

        if re.match(r"^[-*+]\s+", line):
            items = []
            while i < n and re.match(r"^[-*+]\s+", lines[i].strip()):
                items.append(re.sub(r"^[-*+]\s+", "", lines[i].strip()))
                i += 1
            blocks.append({"kind": "list", "items": items})
            continue

        blocks.append({"kind": "paragraph", "raw": line})
        i += 1

    return blocks


def build(md: str):
    blocks = parse(md)
    entries = []
    seq = 0

    def add(kind, text, path, extra=None):
        nonlocal seq
        norm = normalize(text)
        if len(norm) < 1:
            return
        seq += 1
        e = {
            "id": f"c{seq:03d}",
            "kind": kind,
            "path": path,
            "text": text.strip(),
            "norm": norm,
        }
        if extra:
            e.update(extra)
        entries.append(e)

    for b in blocks:
        if b["kind"] == "heading":
            add("heading", b["raw"], f"h{b['level']}", {"level": b["level"]})
        elif b["kind"] == "paragraph":
            add("paragraph", b["raw"], "p")
        elif b["kind"] == "quote":
            for j, it in enumerate(b["items"]):
                add("quote", it, f"quote[{j}]")
        elif b["kind"] == "list":
            for j, it in enumerate(b["items"]):
                add("listitem", it, f"li[{j}]")
        elif b["kind"] == "table":
            for r, row in enumerate(b["rows"]):
                for c, cell in enumerate(row):
                    add("tablecell", cell, f"tr{r}td{c}", {"row": r, "col": c})
        elif b["kind"] == "rule":
            pass

    return blocks, entries


def main():
    src = Path(sys.argv[1])
    out = Path(sys.argv[2])
    out.mkdir(parents=True, exist_ok=True)
    md = src.read_text(encoding="utf-8")
    blocks, entries = build(md)

    (out / "copy-inventory.json").write_text(
        json.dumps(
            {
                "source": src.name,
                "source_bytes": src.stat().st_size,
                "counts": {
                    k: sum(1 for e in entries if e["kind"] == k)
                    for k in ("heading", "paragraph", "quote", "listitem", "tablecell")
                },
                "entries": entries,
            },
            ensure_ascii=False,
            indent=2,
        ),
        encoding="utf-8",
    )

    lines = [f"# 文案清单 · {src.name}", "", f"共 {len(entries)} 条", ""]
    cur = None
    for e in entries:
        if e["kind"] != cur:
            cur = e["kind"]
            lines += ["", f"## {cur}", ""]
        lines.append(f"- `{e['id']}` **{e['path']}** {e['norm']}")
    (out / "copy-sheet.md").write_text("\n".join(lines) + "\n", encoding="utf-8")

    print(json.dumps({k: sum(1 for e in entries if e["kind"] == k) for k in
                      ("heading", "paragraph", "quote", "listitem", "tablecell")},
                     ensure_ascii=False))
    print("total", len(entries))


if __name__ == "__main__":
    main()
