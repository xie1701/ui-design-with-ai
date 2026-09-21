#!/usr/bin/env python3
"""Generate an external alphanumeric design seed."""

import secrets
import string
import sys

ALPHABET = string.ascii_letters + string.digits
ERROR = "usage: create-design-seed.py [length], where length is 16..4096"


def main() -> int:
    if len(sys.argv) > 2:
        print(ERROR, file=sys.stderr)
        return 2

    raw = sys.argv[1] if len(sys.argv) == 2 else "96"
    if raw == "":
        print(ERROR, file=sys.stderr)
        return 2

    try:
        length = int(raw)
    except ValueError:
        print(ERROR, file=sys.stderr)
        return 2

    if not 16 <= length <= 4096:
        print(ERROR, file=sys.stderr)
        return 2

    print("".join(secrets.choice(ALPHABET) for _ in range(length)))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
