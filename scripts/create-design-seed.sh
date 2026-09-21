#!/usr/bin/env bash
set -eu

script_dir=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)

if command -v python3 >/dev/null 2>&1; then
  exec python3 "$script_dir/create-design-seed.py" "${1:-96}"
fi

length="${1:-96}"
if ! echo "$length" | grep -Eq '^[0-9]+$' || [ "$length" -lt 16 ] || [ "$length" -gt 4096 ]; then
  printf 'length must be an integer between 16 and 4096\n' >&2
  exit 2
fi

if [ -r /dev/urandom ]; then
  LC_ALL=C tr -dc 'A-Za-z0-9' < /dev/urandom | head -c "$length"
  printf '\n'
  exit 0
fi

printf 'python3 or a readable /dev/urandom is required\n' >&2
exit 127
