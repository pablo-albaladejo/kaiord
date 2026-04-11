#!/usr/bin/env bash
set -euo pipefail
pnpm exec changeset version
pnpm install --no-frozen-lockfile
