#!/usr/bin/env bash
# AGF Mobile Prototype 01 — smoke test
# Usage: bash tests/smoke.sh [PORT] [--no-server]
# Default PORT = 5180.
#
# By default the script starts its own `python3 -m http.server` on PORT,
# waits for it to come up, runs the checks, then kills the server. Pass
# `--no-server` to skip startup (use this when a server is already running,
# e.g. during a long dev session).
#
# Exit code 0 = all good, 1 = at least one file is missing or non-200.

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
  # Check if something is already on the port; if so, don't double-bind.
  if ! curl -sS -o /dev/null --max-time 1 "$BASE/" 2>/dev/null; then
    echo "Starting python3 -m http.server $PORT ..."
    (cd "$project_root" && python3 -m http.server "$PORT" --bind 127.0.0.1) &
    server_pid=$!
    # Wait for the port to open (up to 5 seconds).
    for _ in $(seq 1 50); do
      if curl -sS -o /dev/null --max-time 1 "$BASE/" 2>/dev/null; then break; fi
      sleep 0.1
    done
  else
    echo "Detected existing server on $PORT; using it (--no-server semantics)."
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
# We list the JSON files directly from disk rather than parsing the page
# so the smoke test still catches data files the page doesn't reference
# (e.g. enemies.json, hazards.json).
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
