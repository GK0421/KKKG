#!/usr/bin/env bash
# AGF Mobile Prototype 01 — smoke test
# Usage: bash tests/smoke.sh [PORT]
# Default PORT = 5180.
#
# Assumes a static server is already serving the project root on 127.0.0.1.
# The script does NOT start the server itself; it only verifies every file
# the page references returns HTTP 200.
#
# Exit code 0 = all good, 1 = at least one file is missing or non-200.

set -u

PORT="${1:-5180}"
BASE="http://127.0.0.1:${PORT}"

fail=0
checked=0

check() {
  local path="$1"
  local code
  code="$(curl -sS -o /dev/null -w "%{http_code}" "${BASE}${path}" || echo "000")"
  checked=$((checked + 1))
  if [ "$code" = "200" ]; then
    printf "  \033[32m%s\033[0m  %s\n" "$code" "$path"
  else
    printf "  \033[31m%s\033[0m  %s\n" "$code" "$path"
    fail=1
  fi
}

echo "Smoke test against ${BASE}"
echo "--- root + entry ---"
check "/"
check "/index.html"
check "/styles.css"

echo "--- src/ (parsed out of index.html) ---"
for f in $(curl -sS "${BASE}/index.html" | grep -oE 'src/[A-Za-z0-9._/]+\.js' | sort -u); do
  check "/${f}"
done

echo "--- data/ (every JSON file in the project) ---"
# We list the JSON files directly from disk rather than parsing the page
# so the smoke test still catches data files the page doesn't reference
# (e.g. enemies.json, hazards.json).
script_dir="$(cd "$(dirname "$0")" && pwd)"
project_root="$(cd "$script_dir/.." && pwd)"
for f in $(find "$project_root/data" -maxdepth 1 -type f -name "*.json" | sed "s#${project_root}/##" | sort); do
  check "/${f}"
done

echo "---"
if [ "$fail" -eq 0 ]; then
  printf "\033[32mALL %d CHECKS PASSED\033[0m\n" "$checked"
  exit 0
else
  printf "\033[31mSMOKE FAILED — at least one file is missing or non-200\033[0m\n"
  exit 1
fi
