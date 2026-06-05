#!/usr/bin/env bash
# 客栈夜雨 — smoke test
# Usage: bash tests/smoke.sh [PORT] [--no-server]
# Default PORT = 5180.
# By default starts its own python3 -m http.server and tears it down on exit.

set -u

PORT="${1:-5180}"
START_SERVER=1
if [ "${1:-}" = "--no-server" ]; then
  START_SERVER=0
  PORT="${2:-5180}"
elif [ "${2:-}" = "--no-server" ]; then
  START_SERVER=0
fi

BASE="http://127.0.0.1:${PORT}"
script_dir="$(cd "$(dirname "$0")" && pwd)"
project_root="$(cd "$script_dir/.." && pwd)"

fail=0
checked=0
server_pid=""

cleanup() {
  if [ -n "$server_pid" ]; then
    kill "$server_pid" 2>/dev/null || true
    wait "$server_pid" 2>/dev/null || true
  fi
}
trap cleanup EXIT

if [ "$START_SERVER" = "1" ]; then
  if ! curl -sS -o /dev/null --max-time 1 "$BASE/" 2>/dev/null; then
    echo "Starting python3 -m http.server $PORT ..."
    (cd "$project_root" && python3 -m http.server "$PORT" --bind 127.0.0.1) &
    server_pid=$!
    for _ in $(seq 1 50); do
      if curl -sS -o /dev/null --max-time 1 "$BASE/" 2>/dev/null; then break; fi
      sleep 0.1
    done
  else
    echo "Detected existing server on $PORT; using it."
  fi
fi

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
for f in $(find "$project_root/data" -maxdepth 1 -type f -name "*.json" | sed "s#${project_root}/##" | sort); do
  check "/${f}"
done

echo "---"
if [ "$fail" -eq 0 ]; then
  printf "\033[32mALL %d CHECKS PASSED\033[0m\n" "$checked"
  exit 0
else
  printf "\033[31mSMOKE FAILED\033[0m\n"
  exit 1
fi
