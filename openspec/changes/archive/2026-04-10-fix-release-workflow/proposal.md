> Completed: 2026-04-10

## Why

The Release workflow (`release.yml`) pushes version bump commits directly to `main`, which is blocked by branch protection rules (requires PR + 7 status checks). This means npm publish and GitHub releases never execute. Additionally, `@kaiord/garmin`, `@kaiord/fit`, `@kaiord/tcx`, and `@kaiord/zwo` are missing from the GitHub releases script.

## What Changes

- Replace manual `changeset version` + `git push` in `release.yml` with `changesets/action@v1`, which creates a "Version Packages" PR instead of pushing directly
- Pass `publish` command as an input to the action so it populates `publishedPackages` output
- Add `pull-requests: write` permission required by the action to create/update PRs
- Remove the infinite-loop guard (`!contains(..., 'chore: version packages')`) — no longer needed since the action handles both modes internally
- Replace hardcoded package list in `create-github-releases.js` with dynamic `PUBLISHED_PACKAGES` env var from the action's output
- Keep hardcoded list as fallback for `workflow_dispatch` runs (manual recovery)
- Add missing `@kaiord/fit`, `@kaiord/tcx`, `@kaiord/zwo`, `@kaiord/garmin` entries to the fallback list

## Capabilities

### New Capabilities

_None — this is a fix to existing CI/CD infrastructure._

### Modified Capabilities

_None — no spec-level behavior changes. This is purely a CI/CD workflow fix._

## Impact

- **Files**: `.github/workflows/release.yml`, `scripts/create-github-releases.js`
- **Layer**: Infrastructure (CI/CD) — no hexagonal architecture layers affected
- **Packages**: No package code changes. Affects the release pipeline for all publishable packages: `@kaiord/core`, `@kaiord/fit`, `@kaiord/tcx`, `@kaiord/zwo`, `@kaiord/garmin`, `@kaiord/garmin-connect`, `@kaiord/cli`, `@kaiord/mcp`, `@kaiord/ai`
- **Dependencies**: Adds `changesets/action@v1` GitHub Action
- **Breaking**: No breaking changes
- **Auth**: npm publishing continues via OIDC (`id-token: write` + `NPM_CONFIG_PROVENANCE`), no token secrets needed
