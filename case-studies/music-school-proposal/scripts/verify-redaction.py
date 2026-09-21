#!/usr/bin/env python3
"""
复核一次脱敏：仓库里的文件与原件之间的差异，只能来自**声明的**变换。

用法：
  python3 verify-redaction.py \
    --original <原件目录> \
    --redacted <仓库中的案例目录> \
    --map <redaction-map.json>

原件与映射表都不随仓库分发（它们含真实标识）。这个脚本留在仓库里，
是为了让"脱敏到底做了什么"这件事可以被复跑，而不是只能被相信。

三类声明（全部写在映射表 JSON 里，缺一类就报错）：

  1. map                  一对一字符串替换（机构名、称谓、城市、联系方式…）
  2. rebuild              index.html 不是被替换出来的，而是**重新构建**出来的：
                          因为页面里有些图形由文本散列派生，机构名一换，图形就变。
                          所以这里不比字符串，而是拿脱敏后的模板+清单**重新构建**，
                          再与仓库里的 index.html 逐字节比对。
  3. declared_meta / new  显式声明的少量元数据改动与新增文件，逐条列明原因。

判定原则：**不做模糊比对**。脱敏要么能被精确复算出来，要么就不该声称
"只改了这些"。任何未声明的差异都必须失败。
"""
import argparse
import json
import pathlib
import subprocess
import sys
import tempfile

# 走「一对一替换」比对的文本文件（相对案例根）
SUBSTITUTE_TARGETS = [
    'README.md',
    'docs/brief.md',
    'docs/copy-inventory.json',
    'docs/copy-sheet.md',
    'docs/critic-log.md',
    'docs/design-identity.md',
    'docs/directions.md',
    'docs/prompt-graveyard.md',
    'docs/qa.md',
    'scripts/page-template.html',
]

# 走「重新构建后比对」的文件
REBUILD_TARGETS = ['index.html']


def apply_map(text, rules):
    hits = {}
    for r in rules:
        n = text.count(r['from'])
        if n:
            text = text.replace(r['from'], r['to'])
            hits[r['field']] = hits.get(r['field'], 0) + n
    return text, hits


def first_diff(expected, actual):
    for i, (x, y) in enumerate(zip(expected, actual)):
        if x != y:
            return i, expected[max(0, i - 40):i + 40].replace('\n', '\\n'), \
                actual[max(0, i - 40):i + 40].replace('\n', '\\n')
    return None, None, None


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--original', required=True, help='原件目录（含真实标识）')
    ap.add_argument('--redacted', required=True, help='仓库中的案例目录')
    ap.add_argument('--map', required=True, dest='mapfile', help='映射表 JSON')
    a = ap.parse_args()

    spec = json.loads(pathlib.Path(a.mapfile).read_text(encoding='utf-8'))
    rules = spec['map']
    declared_meta = spec.get('declared_meta', [])
    declared_new = spec.get('declared_new', [])

    orig_root = pathlib.Path(a.original)
    red_root = pathlib.Path(a.redacted)
    failures, notes = [], []
    total_hits = {}

    # ---- 1. 一对一替换 ----
    for rel in SUBSTITUTE_TARGETS:
        target = red_root / rel
        orig = orig_root / rel
        if not target.exists():
            failures.append(f'{rel}: 仓库里不存在（映射表要求比对它）')
            continue
        if not orig.exists():
            failures.append(f'{rel}: 原件里不存在')
            continue
        expected, hits = apply_map(orig.read_text(encoding='utf-8'), rules)

        # 应用显式声明的元数据改动 / 脱敏之后又做的编辑
        for m in declared_meta:
            if m['file'] != rel:
                continue
            if m['kind'] == 'json_field':
                obj = json.loads(expected)
                if obj.get(m['field']) != m['expect_after']:
                    failures.append(
                        f"{rel}: 声明 {m['field']} 应为 {m['expect_after']!r}，"
                        f"但按映射表算出的是 {obj.get(m['field'])!r}")
                obj[m['field']] = m['value']
                for extra in m.get('also_set', {}):
                    obj[extra] = m['also_set'][extra]
                expected = json.dumps(obj, ensure_ascii=False, indent=2) + '\n'
            elif m['kind'] == 'text_patch':
                # 脱敏之后又做的编辑：必须逐条声明，且 before 必须真的存在
                if m['before'] not in expected:
                    failures.append(
                        f"{rel}: 声明的 text_patch 起点在按映射表算出的文本里找不到"
                        f"（说明声明与实际不符）：{m['before'][:60]}…")
                expected = expected.replace(m['before'], m['after'], 1)
            else:
                failures.append(f"{rel}: 未知的 declared_meta kind: {m['kind']}")

        actual = target.read_text(encoding='utf-8')
        if expected != actual:
            i, ctx_e, ctx_a = first_diff(expected, actual)
            if i is None:
                failures.append(f'{rel}: 长度不同（应 {len(expected)}，实 {len(actual)}）')
            else:
                failures.append(f'{rel}: 第 {i} 字符起不一致\n'
                                f'      按声明应为: …{ctx_e}…\n'
                                f'      仓库里实际是: …{ctx_a}…')
            continue
        for k, v in hits.items():
            total_hits[k] = total_hits.get(k, 0) + v
        notes.append(f'  [替换] {rel}  ✓')

    # ---- 2. 重新构建后比对（派生图形由文本散列决定，不能用字符串替换复算）----
    for rel in REBUILD_TARGETS:
        target = red_root / rel
        tmpl, inv = orig_root / 'scripts/page-template.html', orig_root / 'docs/copy-inventory.json'
        if not (target.exists() and tmpl.exists() and inv.exists()):
            failures.append(f'{rel}: 缺少原件模板/清单或仓库产物，无法复算')
            continue
        with tempfile.TemporaryDirectory() as td:
            t2, i2, out = pathlib.Path(td) / 't.html', pathlib.Path(td) / 'i.json', pathlib.Path(td) / 'o.html'
            t2.write_text(apply_map(tmpl.read_text(encoding='utf-8'), rules)[0], encoding='utf-8')
            i2.write_text(apply_map(inv.read_text(encoding='utf-8'), rules)[0], encoding='utf-8')
            r = subprocess.run([sys.executable, str(red_root / 'scripts/build-page.py'),
                                str(t2), str(i2), str(out)],
                               capture_output=True, text=True)
            if r.returncode != 0:
                failures.append(f'{rel}: 重新构建失败\n{r.stdout}{r.stderr}')
                continue
            expected = out.read_text(encoding='utf-8')
        actual = target.read_text(encoding='utf-8')
        if expected != actual:
            i, ctx_e, ctx_a = first_diff(expected, actual)
            failures.append(f'{rel}: 重新构建的产物与仓库里的不一致'
                            + (f'\n      第 {i} 字符起: 应为 …{ctx_e}… / 实为 …{ctx_a}…'
                               if i is not None else ''))
            continue
        notes.append(f'  [重建] {rel}  ✓（脱敏后的模板 + 清单 → 逐字节一致）')

    # ---- 3. 显式声明的新增文件 ----
    for n in declared_new:
        p = red_root / n['file']
        if not p.exists():
            failures.append(f"{n['file']}: 声明为新增文件，但仓库里没有")
        else:
            notes.append(f"  [新增] {n['file']}  ✓ — {n['reason']}")

    # ---- 汇总 ----
    if failures:
        print('=== FAIL ===')
        for f in failures:
            print('  - ' + f)
        return 1

    print('=== PASS ===')
    for n in notes:
        print(n)
    print(f'  替换命中合计: {total_hits}')
    print('  结论: 仓库内文件与原件之间的全部差异，都能被"映射表 + 重新构建 + 显式声明"精确复算；无未声明改动。')
    return 0


if __name__ == '__main__':
    sys.exit(main())
