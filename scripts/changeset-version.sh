#!/usr/bin/env bash
# Bumps versions for the Version Packages PR.
#
# Husky pre-commit hook (the changesets/action commit triggers it)
# runs `pnpm -r tsc --noEmit --incremental` across every package.
# Workspace packages that import each other via `@kaiord/<name>`
# resolve through `package.json` `types`/`exports` → `./dist/*.d.ts`.
# If `dist/` is missing, every dependent package's typecheck fails
# with "Cannot find module '@kaiord/core'" and the commit is blocked,
# which leaves the Version Packages PR unmergeable.
#
# Building the workspace AFTER the version bump (and before the
# implicit `changesets/action` commit) populates the `dist/` cache
# the pre-commit tsc needs. The build itself is fast — most packages
# are pure TS with `tsup` — and runs in CI only.
set -euo pipefail
pnpm exec changeset version
node scripts/sync-extension-version.mjs
pnpm install --no-frozen-lockfile
pnpm -r build
