<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-05-14 | Updated: 2026-05-14 -->

# scripts

## Purpose

Repo-wide Node.js tooling: mechanical lint guards, archive/spec invariants,
extension packaging helpers, popup CSS sync, CWS API client, and changeset
plumbing. Every non-trivial script here has a co-located `*.test.mjs`
running under `node:test`; CI executes them via `pnpm test:scripts` and
the husky `pre-commit` hook runs the same suite locally.

See `scripts/README.md` for the full inventory and per-script invariant
notes.

## Key Files

### Mechanical guards (run via `pnpm lint`)

| File                                           | Invariant                                                                                     |
| ---------------------------------------------- | --------------------------------------------------------------------------------------------- |
| `check-architecture.mjs`                       | Hexagonal layering (domain doesn't import outer libs)                                         |
| `check-archive-dates.mjs`                      | Archive folder date prefix ⇄ `> Completed:` marker                                            |
| `check-archive-index.mjs`                      | `archive/README.md` ⇄ filesystem                                                              |
| `check-archive-followups.mjs`                  | `> Deferred to: #N` markers + ratio invariant                                                 |
| `check-spec-format.mjs`                        | `SPEC_TEMPLATE.md` placeholders + structure                                                   |
| `check-mapper-no-tests.mjs`                    | `*.mapper.ts` files have NO co-located tests                                                  |
| `check-converter-has-tests.mjs`                | `*.converter.ts` files MUST have co-located tests                                             |
| `check-package-deps.mjs`                       | Cross-package deps use `workspace:*` and match the dep graph                                  |
| `check-no-unconditional-skip.mjs`              | No unconditional `it.skip()` / `describe.skip()`                                              |
| `check-no-library-dual-mount.mjs`              | R-LibraryNoDualMount (SPA editor)                                                             |
| `check-no-pii-leakage.mjs`                     | R-PIIInterpolation (toast/console first args are literals)                                    |
| `check-no-zustand-writethrough.mjs`            | R-DexieImport / R-PersistStateImport / R-AppDexieImport                                       |
| `check-session-match-id-shape.mjs`             | R-SessionMatchIdShape (id construction via canonical helpers)                                 |
| `check-no-perf-marks-in-prod.mjs`              | No `performance.mark()` in production builds                                                  |
| `check-bridge-privacy-surface.mjs`             | Extension privacy surface matches `fixtures/bridge-privacy-surface.json`                      |
| `check-bridge-stale-threshold-parity.test.mjs` | Bridge stale-threshold parity (test-only)                                                     |
| `check-extension-icons-distinct.mjs`           | `lint:icons-distinct` — each extension has unique icon set                                    |
| `check-allowlists-empty.mjs`                   | Allowlists are not silently growing                                                           |
| `check-tsup-ignoredeprecations.mjs`            | Watch-dog for `tsup` ignored-deprecation flags                                                |
| `check-build-portable.mjs`                     | Build artifacts are portable (no absolute paths)                                              |
| `check-ci-fanout-invariants.mjs`               | CI fan-out matrix invariants                                                                  |
| `check-scripts-orphans.mjs`                    | Every script under this folder has a sibling `*.test.mjs`                                     |
| `check-workflow-timeouts.mjs`                  | `.github/workflows/*.yml` declare per-job timeouts                                            |
| `check-overrides-stale.mjs`                    | `pnpm.overrides` entries match installed versions                                             |
| `check-husky-no-bypass-hint.mjs`               | Husky hook content doesn't hint `--no-verify`                                                 |
| `check-hook-collection-map-naming.mjs`         | Hook-collection map naming conventions                                                        |
| `check-test-aaa.mjs`                           | `R-ItBodyAAA` — `// Arrange`/`// Act`/`// Assert` in `it()` bodies                            |
| `check-test-title-should.mjs`                  | `R-ItTitleShould` — `it()` titles start with `"should "`                                      |
| `check-privacy-policy.mjs`                     | Privacy-policy parity (also wired into `packages/docs`)                                       |
| `check-bridge-core-parity.test.mjs`            | Vendored bridge-core copies ⇄ `_shared/bridge-core` masters (byte, purity, identity↔manifest) |
| `check-changeset-config.test.mjs`              | `.changeset/config.json` invariants                                                           |
| `check-commitlint-config.test.mjs`             | `commitlint.config.mjs` invariants                                                            |

### Build / generator scripts

| File                         | Purpose                                                                     |
| ---------------------------- | --------------------------------------------------------------------------- |
| `build-extension-icons.mjs`  | Render `_shared/extension-icon` master SVG into PNG sets per extension      |
| `sync-bridge-core.mjs`       | Sync `_shared/bridge-core` masters into each extension (`pnpm bridge:sync`) |
| `generate-archive-index.mjs` | Regenerate `openspec/changes/archive/README.md`                             |
| `lint-links.sh`              | Markdown link checker entry point (delegates to lychee)                     |
| `check-docs-sync.sh`         | Cross-doc sync check                                                        |
| `changeset-version.sh`       | Wrapper around `changeset version` used by the release workflow             |
| `changeset-publish.sh`       | Wrapper around `changeset publish` used by the release workflow             |
| `architecture.vocab.mjs`     | Shared vocabulary used by `check-architecture.mjs`                          |

## Subdirectories

| Directory   | Purpose                                                                             |
| ----------- | ----------------------------------------------------------------------------------- |
| `cws-api/`  | Chrome Web Store API client (auth, upload, publish, poll) (see `cws-api/AGENTS.md`) |
| `fixtures/` | JSON fixtures consumed by mechanical guards (see `fixtures/AGENTS.md`)              |
| `lib/`      | Shared helpers used across scripts (see `lib/AGENTS.md`)                            |

## For AI Agents

### Working In This Directory

- **Test-or-it-doesn't-exist**: every non-trivial `*.mjs` (i.e. anything
  that does more than `console.log`) MUST have a sibling
  `<name>.test.mjs` using `node:test`. `check-scripts-orphans.mjs` enforces
  this; CI runs `pnpm test:scripts` in the lint job.
- **Pure Node, no TS**: scripts are ESM `.mjs` so they run without a build.
  Use the Node 22 standard library; avoid heavyweight deps.
- **Exit codes**: lint guards exit non-zero on failure with a short summary
  plus the first 3 offending paths. Don't dump the full failure list.
- **Cross-platform**: scripts run on macOS/Linux in CI. No bashisms in `.mjs`.

### Testing Requirements

- `pnpm test:scripts` — runs all `scripts/*.test.mjs` via `node --test`.
- Pre-commit hook runs the same suite.
- Coverage targets do not apply here; behavioral tests + the orphan guard
  are the contract.

### Common Patterns

- Lint guards take an optional `--changed-files <space-separated>` flag for
  pre-commit speed; full-tree mode is the CI default.
- Helpers shared across multiple guards live in `lib/` (e.g.
  `find-package-files.mjs`, `strip-jsonc.mjs`).
- Vocabulary tables (e.g. `architecture.vocab.mjs`) are co-located beside
  the script that consumes them.

## Dependencies

### Internal

- `lib/find-package-files.mjs` — workspace package enumeration.
- `lib/strip-jsonc.mjs` — JSONC parsing for config files.

### External

- Node 22 stdlib (`node:test`, `node:fs`, etc.).
- `lychee` (via `lint-links.sh`).

<!-- MANUAL: -->
