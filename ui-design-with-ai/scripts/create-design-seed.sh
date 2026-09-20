#!/usr/bin/env bash
set -eu

# Generate an external creative seed. It is input to exploration only; never render it.
length="${1:-96}"
if ! [[ "$length" =~ ^[0-9]+$ ]] || [ "$length" -lt 16 ] || [ "$length" -gt 4096 ]; then
  printf 'length must be an integer between 16 and 4096\n' >&2
  exit 2
fi

LC_ALL=C tr -dc 'A-Za-z0-9' < /dev/urandom | head -c "$length"
printf '\n'
