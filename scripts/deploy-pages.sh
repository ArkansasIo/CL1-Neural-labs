#!/usr/bin/env bash
set -euo pipefail

BASE_PATH="${VITE_BASE_PATH:-/CL1-Neural-labs/}"

echo "[CL1] Preparing GitHub Pages deployment"
echo "[CL1] Base path: ${BASE_PATH}"

rm -rf dist
VITE_BASE_PATH="${BASE_PATH}" npm run build

test -f dist/index.html
echo "[CL1] Build complete: dist/index.html"

if [ "${CL1_VERIFY_ONLY:-0}" = "1" ]; then
  echo "[CL1] Verification-only mode; skipping deployment artifact handoff."
  exit 0
fi

echo "[CL1] Pages artifact ready in ./dist"
