#!/usr/bin/env bash
# Install the pinned Node.js toolchain and locked dependencies in cloud sessions.
set -euo pipefail
[ "${CLAUDE_CODE_REMOTE:-}" = "true" ] || exit 0
cd "$CLAUDE_PROJECT_DIR"

want="$(tr -d 'v\n' < .nvmrc)"
if [ "$(node -v 2>/dev/null | tr -d v)" != "$want" ]; then
  npm install -g "n" >/dev/null 2>&1 || true
  n "$want" >/dev/null 2>&1 || npx --yes "node@$want" -v >/dev/null
  hash -r
fi
[ -d node_modules ] || npm ci --no-audit --no-fund
