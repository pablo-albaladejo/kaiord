# `scripts/`

Repo-wide tooling: lint guards, CI helpers, manual maintainer commands.
Every non-trivial script ships with a co-located `*.test.mjs` exercised by
`pnpm test:scripts`. Orphan files are forbidden — see the
`scripts-folder-hygiene` capability (rule `R-ScriptsNoOrphans`) under
`openspec/specs/`.

## Active scripts

| Script                                                    | Purpose                                                                              | Wired by                                                                      |
| --------------------------------------------------------- | ------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------- |
| `architecture.vocab.mjs`                                  | Source of truth for `CORE_ADAPTER_ALLOWLIST` and `PACKAGE_DEPS`. Imported by checks. | `check-architecture.mjs`, `check-package-deps.mjs` (transitive)               |
| `build-extension-icons.mjs`                               | Render `assets/favicon.svg` → `icon{16,48,128}.png` for each extension.              | root `package.json` → `icons:build`                                           |
| `changeset-publish.sh`                                    | Changesets publish step.                                                             | `.github/workflows/release.yml`                                               |
| `changeset-version.sh`                                    | Changesets version step.                                                             | `.github/workflows/release.yml`                                               |
| `check-allowlists-empty.mjs`                              | Drains escape-hatch allowlists across guards.                                        | `pnpm lint:allowlists-empty`                                                  |
| `check-architecture.mjs`                                  | Hexagonal-architecture rules (`R-Arch*`).                                            | `pnpm lint:architecture`                                                      |
| `check-archive-dates.mjs`                                 | Archive folder date prefix == `> Completed:` marker.                                 | `pnpm lint:archive`                                                           |
| `check-archive-followups.mjs`                             | Followup-marker invariant on archived changes.                                       | `pnpm lint:archive-followups`                                                 |
| `check-archive-index.mjs`                                 | Drift guard for `openspec/changes/archive/README.md`.                                | `pnpm lint:archive-index`                                                     |
| `check-bridge-privacy-surface.mjs`                        | Guards the bridge popups against PII regressions.                                    | `pnpm test:scripts`                                                           |
| `check-bridge-stale-threshold-parity.test.mjs`            | Test-only parity invariant on bridge stale thresholds.                               | `pnpm test:scripts`                                                           |
| `check-build-portable.mjs`                                | Portable-build invariant.                                                            | `pnpm lint:build-portable`                                                    |
| `check-changeset-config.test.mjs`                         | Test-only invariant on `.changeset/config.json`.                                     | `pnpm test:scripts`                                                           |
| `check-ci-fanout-invariants.mjs`                          | CI fan-out invariants.                                                               | `pnpm lint:ci-fanout`                                                         |
| `check-commitlint-config.test.mjs`                        | Test-only invariant on commitlint config.                                            | `pnpm test:scripts`                                                           |
| `check-converter-has-tests.mjs`                           | `*.converter.ts` MUST have a sibling test.                                           | `pnpm lint:converter-has-tests`                                               |
| `check-docs-sync.sh`                                      | Advisory reminder when source changes without docs.                                  | `.claude/settings.json` (Claude Code hook)                                    |
| `check-extension-icons-distinct.mjs`                      | Extension icon hashes must differ across sizes.                                      | `pnpm lint:icons-distinct`                                                    |
| `check-hook-collection-map-naming.mjs`                    | Hook + collection-map naming invariant.                                              | `pnpm test:scripts`                                                           |
| `check-husky-no-bypass-hint.mjs`                          | Husky hooks MUST NOT advertise `--no-verify`.                                        | `pnpm lint:husky-no-bypass`                                                   |
| `check-mapper-no-tests.mjs`                               | `*.mapper.ts` MUST NOT have a sibling test.                                          | `pnpm lint:mapper-no-tests`                                                   |
| `check-no-library-dual-mount.mjs`                         | `R-LibraryNoDualMount`.                                                              | `pnpm lint:no-library-dual-mount`                                             |
| `check-no-perf-marks-in-prod.mjs`                         | `performance.mark` not allowed in production code paths.                             | `pnpm test:scripts`                                                           |
| `check-no-pii-leakage.mjs`                                | `R-PIIInterpolation` — toast/console first-arg literal-only.                         | `pnpm test:scripts`                                                           |
| `check-no-unconditional-skip.mjs`                         | `R-NoUnconditionalSkip` — bare `it.only`/`describe.skip` rejected.                   | `pnpm lint:no-unconditional-skip`                                             |
| `check-no-zustand-writethrough.mjs`                       | `R-DexieImport` — Zustand stores MUST NOT touch Dexie.                               | `pnpm test:scripts`                                                           |
| `check-overrides-stale.mjs`                               | `R-OverridesStale` — every `pnpm.overrides` entry is required or allowlisted.        | `pnpm lint:overrides-stale`                                                   |
| `check-package-deps.mjs`                                  | `R-ArchPackageDeps` — `@kaiord/*` cross-package allowlist.                           | `pnpm lint:package-deps`                                                      |
| `check-popup-css-parity.test.mjs`                         | Test-only parity on extension popup CSS.                                             | `pnpm test:scripts`                                                           |
| `check-scripts-orphans.mjs`                               | `R-ScriptsNoOrphans` — every `scripts/*` file is wired or allowlisted.               | `pnpm lint:scripts-orphans`                                                   |
| `check-spec-format.mjs`                                   | Spec format (template + structural).                                                 | `pnpm lint:specs`                                                             |
| `check-test-aaa.mjs`                                      | `R-ItBodyAAA` — test bodies in Arrange/Act/Assert sections.                          | `pnpm test:scripts`                                                           |
| `check-test-title-should.mjs`                             | `R-ItTitleShould` — test titles begin with `should `.                                | `pnpm test:scripts`                                                           |
| `check-tsup-ignoredeprecations.mjs`                       | Tsup deprecation watchdog.                                                           | `pnpm lint:tsup-watchdog`                                                     |
| `ci-failure-issue.mjs` (+ `ci-failure-issue-helpers.mjs`) | Open / close CI failure issues.                                                      | `.github/workflows/ci*.yml`                                                   |
| `create-github-releases.js`                               | Create GitHub releases after Changesets publish.                                     | `.github/workflows/release.yml`                                               |
| `cws-api.mjs` (+ `cws-api/*`)                             | Chrome Web Store API client (auth, upload, publish, poll).                           | `.github/workflows/cws-publish.yml`                                           |
| `cws-notify-issue.mjs`                                    | Open issues on CWS publish failures.                                                 | `.github/workflows/cws-publish.yml`                                           |
| `extract-changelog.sh`                                    | Extract version-specific section from `CHANGELOG.md`.                                | `create-github-releases.js` (transitive)                                      |
| `generate-archive-index.mjs`                              | Render archive `README.md`.                                                          | `pnpm archive:index` (and reused by `check-archive-index.mjs`)                |
| `inject-spa-fallback.mjs`                                 | Inject rafgraph 404 fallback into deployed SPA.                                      | `.github/workflows/deploy-site.yml`                                           |
| `it-title-extractor.mjs`                                  | Shared AST extractor for `it()` titles.                                              | `check-test-title-should.mjs`, `measure-it-titles-histogram.mjs` (transitive) |
| `lint-links.sh`                                           | Lychee link check across project Markdown.                                           | `pnpm lint:links` and `.github/workflows/ci.yml`                              |
| `measure-it-titles-histogram.mjs`                         | Diagnostic histogram of `it()` title prefixes.                                       | `pnpm test:scripts`                                                           |
| `package-extension.sh`                                    | Package an extension into a Chrome Web Store `.zip`.                                 | `.github/workflows/cws-publish.yml`                                           |
| `sync-extension-version.mjs`                              | Sync extension `manifest.json` version with package.json.                            | `.github/workflows/cws-publish.yml`                                           |
| `sync-popup-css.mjs`                                      | Sync extension popup CSS across surfaces.                                            | `pnpm popup:sync`                                                             |

## Manual maintainer tools

These scripts are not auto-invoked. They live here as documented helpers
for one-off maintainer flows. Each entry below is read by
`check-scripts-orphans.mjs` as the legitimate reason the script is in the
tree — keep the format `- \`<filename>\` — When to run: <reason>`.

<!-- manual-tools:start -->

- `create-release.sh` — When to run: when shipping a manual hotfix release with a package-scoped tag (bypasses the normal Changesets flow). Documented in `DEPLOYMENT.md`.
- `parse-release-tag.sh` — When to run: when validating a `@kaiord/<pkg>@<version>` tag locally; used by `create-release.sh`.
- `validate-package.sh` — When to run: when validating that a package version matches its `package.json` before pushing a tag; used by `create-release.sh`.
<!-- manual-tools:end -->

## Subdirectories

| Folder      | Purpose                                                                                                                 |
| ----------- | ----------------------------------------------------------------------------------------------------------------------- |
| `lib/`      | Reusable helpers (`find-package-files.mjs`, `strip-jsonc.mjs`) imported by checks.                                      |
| `cws-api/`  | Chrome Web Store API modules (`auth`, `cli`, `errors`, `poll`, `publish`, `state`, `upload`) imported by `cws-api.mjs`. |
| `fixtures/` | Test-data JSON consumed by checks (e.g. `bridge-privacy-surface.json`).                                                 |

These three folders are excluded from the orphan lint — their files are
internal-only modules of their parent script.

## pnpm.overrides allowlist

Each entry below is read by `check-overrides-stale.mjs` (rule
`R-OverridesStale`). The check classifies an override as **stale** when no
transitive dependency in `pnpm-lock.yaml` would, without the override,
resolve to a version inside its vulnerable range. Rather than dropping a
defensive pin and risking a regression if a future dep introduces a
vulnerable transitive, an override may be kept in place by adding a row
here that names the override key and a one-line "Why kept" justification.

Format: `- \`<override-key>\` — Why kept: <reason>`. The override key MUST
match a current entry in `package.json#pnpm.overrides`; orphan or no-longer-
stale entries fail the check.

<!-- overrides-allowlist:start -->

- `lodash@<4.17.23` — Why kept: defensive pin against historical lodash CVE-2020-8203 / CVE-2021-23337; no transitive currently pulls lodash but the pin guards future drift.
- `@isaacs/brace-expansion@<=5.0.0` — Why kept: defensive pin against CVE-2025-5889 ReDoS; not currently in the tree but kept as forward-defense.
- `undici@<6.23.0` — Why kept: defensive pin against CVE-2025-22150 / CVE-2025-47279; current transitives request newer 6.x but pin guards regression.
- `minimatch@>=9.0.0 <9.0.7` — Why kept: defensive pin against minimatch 9.0.x ReDoS; current transitives request 9.0.9+ but pin guards regression.
- `fast-xml-parser@<5.5.6` — Why kept: workspace adapters use ^5.7.2; pin retained as belt-and-braces against future transitive ingestion of older versions.
- `undici@>=7.0.0 <7.24.0` — Why kept: defensive pin paired with the 6.x undici pin; both guard against future undici CVEs in the 7.x line.
- `smol-toml@<1.6.1` — Why kept: defensive pin against pre-1.6.1 smol-toml parsing CVE; current transitives are clean but pin guards regression.

<!-- overrides-allowlist:end -->

## Authoring a new script

1. **Co-located test.** Every new `scripts/<name>.{mjs,js,sh}` SHOULD have a
   `*.test.mjs` exercised by `pnpm test:scripts`.
2. **Entry-point guard:** use
   `if (import.meta.url === pathToFileURL(process.argv[1]).href)` from
   `node:url` — string concatenation is Windows-hostile.
3. **Path resolution:** resolve repo paths via `import.meta.url` +
   `fileURLToPath`. Never rely on `process.cwd()`.
4. **Pure exports:** expose the core logic as a named export
   (`findOrphans()`, `buildIndex()`) so tests can drive it without
   spawning a subprocess where possible.
5. **Wire it.** Add a `pnpm` script (`lint:*` or similar), invoke it from a
   workflow, husky hook, Claude hook, OR add an entry to the manual-tools
   block above. Otherwise `R-ScriptsNoOrphans` will reject it.
