#!/usr/bin/env python3
"""Generate an external alphanumeric design seed."""

import secrets
import string
import sys

ALPHABET = string.ascii_letters + string.digits


def main() -> int:
    try:
        length = int(sys.argv[1]) if len(sys.argv) > 1 else 96
    except ValueError:
        print("length must be an integer between 16 and 4096", file=sys.stderr)
        return 2

    if not 16 <= length <= 4096:
        print("length must be an integer between 16 and 4096", file=sys.stderr)
        return 2

    print("".join(secrets.choice(ALPHABET) for _ in range(length)))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
