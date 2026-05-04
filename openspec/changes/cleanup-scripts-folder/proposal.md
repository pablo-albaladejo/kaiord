## Why

`scripts/` has accumulated orphan files. The README documents code that no longer exists (`test-ci-workflows.sh`, the `publishing/` helpers), legacy npm-token setup scripts that have been superseded by Trusted Publishing in `release.yml`, predecessor scripts that lost their wiring (`validate-links.sh` → `lint-links.sh`, `generate-extension-icons.mjs` → `build-extension-icons.mjs`), and personal-tooling that hasn't been touched in months (the `autonomous-loop.sh` stack).

The folder is now hard to navigate: a contributor cannot tell at a glance which file is load-bearing. This change audits every file, deletes the dead ones, and codifies a hygiene rule so the orphan layer cannot regrow silently.

## What Changes

### Audit table

Every file under `scripts/` (and its subdirectories) classified as **DELETE** or **KEEP**. For KEEP entries, the concrete wiring point is named so the next maintainer can verify it. For DELETE entries, the reason is stated. The default-when-unsure is DELETE — anything kept must point at a load-bearing use case.

Subdirectory files are listed under their parent.

#### Top-level files

| File                                                   | Verdict        | Reason / use case                                                                                                                                                                                                                                              |
| ------------------------------------------------------ | -------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `README.md`                                            | KEEP (rewrite) | Folder index. Currently documents `test-ci-workflows.sh` (deleted), `publishing/*` helpers (deleted), and legacy npm-token flows. Will be rewritten to match reality.                                                                                          |
| `architecture.vocab.mjs`                               | KEEP           | Imported by `check-architecture.mjs` and `check-package-deps.mjs`. Exports `CORE_ADAPTER_ALLOWLIST` and `PACKAGE_DEPS`. Mirrored in `.claude/skills/guidelines/architecture-hexagonal/SKILL.md`.                                                               |
| `autonomous-loop.sh`                                   | DELETE         | Personal background-improvement loop driven by Claude CLI. Referenced only from `.github/docs/autonomous-setup.md` (also deleted). Last touched Mar 2026. Recoverable from `git log` if ever needed.                                                           |
| `build-extension-icons.mjs` (+ `.test.mjs`)            | KEEP           | Wired via root `package.json` → `icons:build`. Renders `assets/favicon.svg` to PNGs for both extensions.                                                                                                                                                       |
| `changeset-publish.sh`                                 | KEEP           | Invoked by `.github/workflows/release.yml` step `publish:`.                                                                                                                                                                                                    |
| `changeset-version.sh`                                 | KEEP           | Invoked by `.github/workflows/release.yml` step `version:`.                                                                                                                                                                                                    |
| `check-allowlists-empty.mjs` (+ `.test.mjs`)           | KEEP           | Wired via `pnpm lint:allowlists-empty`. Drains escape-hatch allowlists.                                                                                                                                                                                        |
| `check-architecture.mjs` (+ `.test.mjs`)               | KEEP           | Wired via `pnpm lint:architecture`. Enforces hexagonal layer rules (R-Arch\*).                                                                                                                                                                                 |
| `check-archive-dates.mjs` (+ `.test.mjs`)              | KEEP           | Wired via `pnpm lint:archive`. Validates archive folder date prefix vs. `> Completed:` marker.                                                                                                                                                                 |
| `check-archive-followups.mjs` (+ `.test.mjs`)          | KEEP           | Wired via `pnpm lint:archive-followups`. Specced in `archive-followups-guard`.                                                                                                                                                                                 |
| `check-archive-index.mjs` (+ `.test.mjs`)              | KEEP           | Wired via `pnpm lint:archive-index`. Drift guard for `archive/README.md`.                                                                                                                                                                                      |
| `check-bridge-privacy-surface.mjs` (+ `.test.mjs`)     | KEEP           | Wired via `pnpm test:scripts`. Guards bridge popup against PII regressions; uses `fixtures/bridge-privacy-surface.json`.                                                                                                                                       |
| `check-bridge-stale-threshold-parity.test.mjs`         | KEEP           | Test-only invariant (no `.mjs`); enforces parity of stale thresholds across both extension popups.                                                                                                                                                             |
| `check-build-portable.mjs` (+ `.test.mjs`)             | KEEP           | Wired via `pnpm lint:build-portable`.                                                                                                                                                                                                                          |
| `check-changeset-config.test.mjs`                      | KEEP           | Test-only invariant; guards `.changeset/config.json` shape.                                                                                                                                                                                                    |
| `check-ci-fanout-invariants.mjs` (+ `.test.mjs`)       | KEEP           | Wired via `pnpm lint:ci-fanout`.                                                                                                                                                                                                                               |
| `check-commitlint-config.test.mjs`                     | KEEP           | Test-only invariant for commitlint config.                                                                                                                                                                                                                     |
| `check-converter-has-tests.mjs` (+ `.test.mjs`)        | KEEP           | Wired via `pnpm lint:converter-has-tests`.                                                                                                                                                                                                                     |
| `check-docs-sync.sh`                                   | KEEP           | Wired as Claude Code hook in `.claude/settings.json:38`. Advisory pre-commit reminder.                                                                                                                                                                         |
| `check-extension-icons-distinct.mjs` (+ `.test.mjs`)   | KEEP           | Wired via `pnpm lint:icons-distinct`.                                                                                                                                                                                                                          |
| `check-hook-collection-map-naming.mjs` (+ `.test.mjs`) | KEEP           | Wired via `pnpm test:scripts`.                                                                                                                                                                                                                                 |
| `check-husky-no-bypass-hint.mjs` (+ `.test.mjs`)       | KEEP           | Wired via `pnpm lint:husky-no-bypass`.                                                                                                                                                                                                                         |
| `check-mapper-no-tests.mjs` (+ `.test.mjs`)            | KEEP           | Wired via `pnpm lint:mapper-no-tests`.                                                                                                                                                                                                                         |
| `check-no-library-dual-mount.mjs` (+ `.test.mjs`)      | KEEP           | Wired via `pnpm lint:no-library-dual-mount`.                                                                                                                                                                                                                   |
| `check-no-perf-marks-in-prod.mjs` (+ `.test.mjs`)      | KEEP           | Wired via `pnpm test:scripts`.                                                                                                                                                                                                                                 |
| `check-no-pii-leakage.mjs` (+ `.test.mjs`)             | KEEP           | Wired via `pnpm test:scripts` (R-PIIInterpolation).                                                                                                                                                                                                            |
| `check-no-unconditional-skip.mjs` (+ `.test.mjs`)      | KEEP           | Wired via `pnpm lint:no-unconditional-skip`.                                                                                                                                                                                                                   |
| `check-no-zustand-writethrough.mjs` (+ `.test.mjs`)    | KEEP           | Wired via `pnpm test:scripts` (R-DexieImport).                                                                                                                                                                                                                 |
| `check-package-deps.mjs` (+ `.test.mjs`)               | KEEP           | Wired via `pnpm lint:package-deps`.                                                                                                                                                                                                                            |
| `check-popup-css-parity.test.mjs`                      | KEEP           | Test-only invariant for extension popup CSS parity.                                                                                                                                                                                                            |
| `check-spec-format.mjs` (+ `.test.mjs`)                | KEEP           | Wired via `pnpm lint:specs`.                                                                                                                                                                                                                                   |
| `check-test-aaa.mjs` (+ `.test.mjs`)                   | KEEP           | Wired via `pnpm test:scripts` (R-ItBodyAAA). Specced in `test-conventions`.                                                                                                                                                                                    |
| `check-test-title-should.mjs` (+ `.test.mjs`)          | KEEP           | Wired via `pnpm test:scripts` (R-ItTitleShould). Specced in `test-conventions`.                                                                                                                                                                                |
| `check-tsup-ignoredeprecations.mjs` (+ `.test.mjs`)    | KEEP           | Wired via `pnpm lint:tsup-watchdog`.                                                                                                                                                                                                                           |
| `ci-failure-issue.mjs` (+ helpers + `.test.mjs`)       | KEEP           | Invoked by `.github/workflows/ci.yml`, `ci-issue-bot-canary.yml`, `ci-issue-bot-success.yml`.                                                                                                                                                                  |
| `com.kaiord.autonomous.plist`                          | DELETE         | LaunchAgent for `autonomous-loop.sh`. Same fate as that script. User must `launchctl unload` it locally (manual one-time step, not a CI concern).                                                                                                              |
| `create-github-releases.js`                            | KEEP           | Invoked by `.github/workflows/release.yml`. Calls `extract-changelog.sh`.                                                                                                                                                                                      |
| `create-release.sh`                                    | KEEP           | Manual maintainer tool for hotfix package-scoped tags; documented in `DEPLOYMENT.md`. Depends on `parse-release-tag.sh` and `validate-package.sh`.                                                                                                             |
| `cws-api.mjs` (+ `.test.mjs`)                          | KEEP           | Invoked by `.github/workflows/cws-publish.yml` (check / state / upload / publish / wait).                                                                                                                                                                      |
| `cws-notify-issue.mjs` (+ `.test.mjs`)                 | KEEP           | Invoked by `.github/workflows/cws-publish.yml` for failure paths.                                                                                                                                                                                              |
| `extract-changelog.sh`                                 | KEEP           | Invoked from `create-github-releases.js:108`.                                                                                                                                                                                                                  |
| `generate-archive-index.mjs` (+ `.test.mjs`)           | KEEP           | Wired via `pnpm archive:index`; reused by `check-archive-index.mjs` for drift detection.                                                                                                                                                                       |
| `generate-brand-assets.mjs`                            | DELETE         | One-shot SVG→PNG generator for root `assets/`. No reference from `package.json`, workflows, husky, or Claude hooks. Safe to delete; assets are committed.                                                                                                      |
| `generate-extension-icons.mjs`                         | DELETE         | Superseded by `build-extension-icons.mjs` (which has a test and is wired via `icons:build`). Older sibling, unwired.                                                                                                                                           |
| `generate-store-assets.mjs`                            | DELETE         | One-shot store-screenshot generator for `garmin-bridge`. No CI reference. Output is committed.                                                                                                                                                                 |
| `generate-train2go-store-assets.mjs`                   | DELETE         | One-shot store-screenshot generator for `train2go-bridge`. No CI reference. Output is committed.                                                                                                                                                               |
| `inject-spa-fallback.mjs` (+ `.test.mjs`)              | KEEP           | Invoked by `.github/workflows/deploy-site.yml` (rafgraph 404 fallback). Specced in `spa-routing`.                                                                                                                                                              |
| `it-title-extractor.mjs` (+ `.test.mjs`)               | KEEP           | Imported by `check-test-title-should.mjs` and `measure-it-titles-histogram.mjs`.                                                                                                                                                                               |
| `lint-links.sh`                                        | KEEP           | Wired via root `package.json` → `lint:links` and `.github/workflows/ci.yml`. Uses `lychee.toml`.                                                                                                                                                               |
| `measure-it-titles-histogram.mjs` (+ `.test.mjs`)      | KEEP           | Diagnostic helper for the should-prefix migration; covered by `pnpm test:scripts`.                                                                                                                                                                             |
| `package-extension.sh`                                 | KEEP           | Invoked by `.github/workflows/cws-publish.yml`. Specced in `extension-store-publish` and `cws-train2go-listing`.                                                                                                                                               |
| `parse-release-tag.sh`                                 | KEEP           | Used by `create-release.sh` and documented in `DEPLOYMENT.md` for manual hotfix tagging.                                                                                                                                                                       |
| `quick-setup-npm-cli.sh`                               | DELETE         | Legacy npm-token helper for `@kaiord/cli`. README itself flags it as superseded by Trusted Publishing (now active in `release.yml`). No reference from `package.json`, workflows, or hooks.                                                                    |
| `quick-setup-npm.sh`                                   | DELETE         | Wired via root `package.json` → `setup:npm`. Legacy npm-token helper for `@kaiord/core`; superseded by Trusted Publishing in `release.yml`. The `setup:npm` script is also dropped from root `package.json`.                                                   |
| `setup-npm-publishing.sh`                              | DELETE         | Wired via root `package.json` → `setup:npm:full`. Same legacy-token rationale; superseded by Trusted Publishing. The `setup:npm:full` script is also dropped from root `package.json`.                                                                         |
| `setup-trusted-publishing-cli.sh`                      | DELETE         | Documented in README only; one-time bootstrap helper for Trusted Publishing on `@kaiord/cli`. Trusted Publishing is already configured and live; the helper is not re-runnable in any meaningful sense. No reference from `package.json`, workflows, or hooks. |
| `sync-extension-version.mjs` (+ `.test.mjs`)           | KEEP           | Invoked by `.github/workflows/cws-publish.yml`. Specced in `cws-auto-publish` and `cws-train2go-listing`.                                                                                                                                                      |
| `sync-fonts.sh`                                        | DELETE         | Manual helper to copy Inter font files to surface `public/` folders when bumping Inter. Not wired anywhere. On the next Inter bump, the four `cp` commands are easier to type by hand than to look up.                                                         |
| `sync-popup-css.mjs`                                   | KEEP           | Wired via root `package.json` → `popup:sync`. Also covered by `check-popup-css-parity.test.mjs`.                                                                                                                                                               |
| `validate-links.sh`                                    | DELETE         | Predecessor of `lint-links.sh` (the lychee-based active script). No reference anywhere. Nov 2025.                                                                                                                                                              |
| `validate-package.sh`                                  | KEEP           | Used by `create-release.sh` and documented in `DEPLOYMENT.md` for manual hotfix flow.                                                                                                                                                                          |

#### `scripts/lib/` — KEEP all

| File                     | Reason                                                |
| ------------------------ | ----------------------------------------------------- |
| `find-package-files.mjs` | Imported by `check-package-deps.mjs`.                 |
| `strip-jsonc.mjs`        | Imported by checks that read `tsconfig.json` (JSONC). |

#### `scripts/cws-api/` — KEEP all

`auth.mjs`, `cli.mjs`, `errors.mjs`, `poll.mjs`, `publish.mjs`, `state.mjs`, `upload.mjs` are all imported by `cws-api.mjs`, which is invoked by `.github/workflows/cws-publish.yml`. Specced in `cws-auto-publish`.

#### `scripts/fixtures/` — KEEP all

`bridge-privacy-surface.json` is loaded by `check-bridge-privacy-surface.mjs`.

#### `scripts/prompts/` — DELETE all

Six markdown prompt files (`bundles.md`, `complexity.md`, `coverage.md`, `deps.md`, `lint.md`, `test.md`) consumed only by `autonomous-loop.sh`. Deleted alongside that script.

#### `scripts/publishing/` — DELETE the folder

Contains only a stale `README.md` documenting two shell scripts (`detect-package-changes.sh`, `generate-changesets.sh`) that **do not exist on disk**. Orphan documentation; deleting the folder removes a misleading signal.

### Documentation cleanup

In addition to file deletions:

- **Rewrite `scripts/README.md`** — collapse from ~830 lines to a single index table aligned with reality. Drop the entire `## test-ci-workflows.sh` section (~280 lines), all legacy npm-setup sections, and the duplicated changelog/release narrative that already lives in `DEPLOYMENT.md`.
- **`DEPLOYMENT.md` and `docs/deployment.md`** — remove every `./scripts/test-ci-workflows.sh` reference (5 in `DEPLOYMENT.md`, 3 in `docs/deployment.md`). The script doesn't exist.
- **`.github/docs/autonomous-setup.md`** — deleted alongside the autonomous-loop stack.

### Hygiene rule (new capability)

To prevent orphan accumulation from happening again, add a CI lint that fails when a file under `scripts/` has no reference from any wiring point. Wiring points considered legitimate:

1. Root `package.json` `scripts.*`
2. Any sub-package `package.json` `scripts.*`
3. `.github/workflows/*.yml` shell steps
4. `.husky/*` hooks
5. `.claude/settings.json` hook commands
6. Another script in `scripts/` (transitive imports)
7. An explicit "manual maintainer tool" allowlist documented in `scripts/README.md`

The lint runs in `pnpm test:scripts`. Adding a new script without a wiring point fails CI.

## Capabilities

### New Capabilities

- `scripts-folder-hygiene`: Defines the invariant "every file under `scripts/` MUST be referenced from a wiring point or appear in the manual-maintainer allowlist documented in `scripts/README.md`". Enforced mechanically by `scripts/check-scripts-orphans.mjs` (R-ScriptsNoOrphans).

### Modified Capabilities

_None._ This change does not alter the spec-level behavior of any existing capability. The `archive-followups-guard`, `hexagonal-arch`, `test-conventions`, `spa-routing`, `cws-auto-publish`, `cws-train2go-listing`, and `extension-store-publish` specs reference scripts that are all classified KEEP — their behavior does not change.

## Impact

- **Files deleted**:
  - `scripts/generate-brand-assets.mjs`
  - `scripts/generate-extension-icons.mjs`
  - `scripts/generate-store-assets.mjs`
  - `scripts/generate-train2go-store-assets.mjs`
  - `scripts/quick-setup-npm-cli.sh`
  - `scripts/quick-setup-npm.sh`
  - `scripts/setup-npm-publishing.sh`
  - `scripts/setup-trusted-publishing-cli.sh`
  - `scripts/sync-fonts.sh`
  - `scripts/validate-links.sh`
  - `scripts/autonomous-loop.sh`
  - `scripts/com.kaiord.autonomous.plist`
  - `scripts/prompts/` (folder, 6 files)
  - `scripts/publishing/` (folder, README only)
  - `.github/docs/autonomous-setup.md`
- **Documentation rewritten**: `scripts/README.md` (large rewrite); `DEPLOYMENT.md` and `docs/deployment.md` (remove `test-ci-workflows.sh` references).
- **New script**: `scripts/check-scripts-orphans.mjs` + co-located test, wired into `pnpm test:scripts`.
- **Root `package.json`**: drop `setup:npm` and `setup:npm:full` (their backing scripts are deleted).
- **OpenSpec sync follow-up**: after this change archives, run `/opsx-sync` to refresh any domain spec that referenced a deleted script. Specs to re-verify: none currently reference the deleted files (the wiring-table audit confirmed all spec-referenced scripts are KEEP), but the sync pass is mandatory because `scripts/README.md` is rewritten and the new `R-ScriptsNoOrphans` rule lands.
- **No code changes** to any `@kaiord/*` package. No public API impact. No round-trip impact. No release-pipeline impact (Trusted Publishing path is untouched; the deleted setup scripts were never on the pipeline).
- **Risk**: low. Each deletion was verified by `grep -rn <name> --exclude-dir=node_modules`. The new orphan lint provides forward protection.
