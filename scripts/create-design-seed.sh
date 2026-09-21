#!/usr/bin/env bash
set -eu

usage='usage: create-design-seed.sh [length], where length is 16..4096'

if [ "$#" -gt 1 ]; then
  printf '%s\n' "$usage" >&2
  exit 2
fi

if [ "$#" -eq 1 ]; then
  length=$1
  if [ -z "$length" ]; then
    printf '%s\n' "$usage" >&2
    exit 2
  fi
else
  length=96
fi

script_dir=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)

if command -v python3 >/dev/null 2>&1; then
  exec python3 "$script_dir/create-design-seed.py" "$length"
fi

if ! echo "$length" | grep -Eq '^[0-9]+$' || [ "$length" -lt 16 ] || [ "$length" -gt 4096 ]; then
  printf '%s\n' "$usage" >&2
  exit 2
fi

if [ -r /dev/urandom ]; then
  LC_ALL=C tr -dc 'A-Za-z0-9' < /dev/urandom | head -c "$length"
  printf '\n'
  exit 0
fi

printf 'python3 or a readable /dev/urandom is required\n' >&2
exit 127
