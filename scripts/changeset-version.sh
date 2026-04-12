#!/usr/bin/env bash
set -euo pipefail
pnpm exec changeset version
node scripts/sync-extension-version.mjs
pnpm install --no-frozen-lockfile
