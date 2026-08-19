#!/usr/bin/env bash
# Bumps versions for the Version Packages PR.
#
# changesets/action v2 pushes the version commit through the GitHub API,
# so no local git commit is created here and husky hooks never run. The
# `pnpm -r build` this script used to carry (populating dist/ so the
# pre-commit tsc could resolve @kaiord/* imports) became dead weight with
# that change and was removed. The publish path is unaffected:
# changeset-publish.sh still runs `pnpm -r build` before publishing.
set -euo pipefail
pnpm exec changeset version
node scripts/sync-extension-version.mjs
pnpm install --no-frozen-lockfile
