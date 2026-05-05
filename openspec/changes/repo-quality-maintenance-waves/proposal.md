## Why

The kaiord codebase is structurally healthy (clean hex arch, strict TS, zero skipped tests, no dead code) but has accumulated discrete pockets of maintenance debt that hurt daily DX, mask regressions, and concentrate risk in a few oversized files. We have a dedicated maintenance window now and want to drain the queue in a controlled, parallel-friendly way before evolutionary work resumes — without introducing any new product capability.

## What Changes

This change is **non-evolutionary**. It bundles defensive walls, DX speedups, test-floor lifts, and structural refactors into six sequenced waves designed for autonomous agent execution under `/opsx-ship`.

- **Wave 1 — Defensive walls**: wire `.size-limit.json` and `.jscpd.json` into CI (including updates to the `lint-summary` aggregator and branch-protection so they are real required checks, not nominal jobs); add `timeout-minutes` to every CI job; add 4 missing READMEs (`docs`, `garmin-bridge`, `landing`, `train2go-bridge`); audit `pnpm.overrides` and add a `lint:overrides-stale` mechanical guard; decouple `workout-spa-editor` runtime config from the Vite bundle so the artifact is environment-agnostic across **all five `VITE_CF_ANALYTICS_TOKEN` surfaces** — `main.tsx`, `index.html` template token, `vite.config.ts` injection logic, `e2e/spa-route-refresh.spec.ts` test fixture, and the `docs/analytics.md` documentation (12-factor III + V).
- **Wave 2 — DX speedup**: convert pre-commit to `lint-staged` + tsc-incremental + `test:scripts` (target <30s); parallelize the 17 sequential `lint:*` checks; replace `pre-push lint:fix` with verify-only `pre-push lint`.
- **Wave 3 — Backend test floor**: lift `core` (14% → ≥30%) and `garmin` (15% → ≥30%) test ratios; split oversized backend files (>100 LOC budget) in `fit`, `tcx`, `zwo`, `cli`.
- **Wave 4 — Spa-editor structural refactors**: extract shared repetition-block / step mutation helpers; split `src/types/index.ts` (172 LOC); split `CalendarPage.tsx` (156 LOC) into hook + view; build a selector registry for the workout store; right-size the remaining files over budget.
- **Wave 5 — Spa-editor coverage**: add tests for currently-untested organism hooks (`ZoneEditor/hooks/*`, `ProfileManager/hooks/*`, `WorkoutLibrary/components/*`, `WorkoutList/hooks/*`).
- **Wave 6 — Domain zones extraction**: a code-inspection audit (recorded in design.md D2 below) found that the alleged "cross-adapter duplication" is largely format-specific encoding (FIT's `value+1000` watts offset, ZWO's `*100` FTP-fraction arithmetic, TCX's `Low/High` BPM bands) — not duplicated logic. The single genuine cross-domain artifact is the 7-band power-zone table currently isolated in `packages/zwo/src/adapters/target/power.converter.ts:56`. Wave 6 extracts that (and any HR-zone equivalent the W6.1 audit confirms) into `packages/core/src/domain/zones/`, migrates the only adapter that holds a copy (`zwo`), and verifies round-trip tolerances and an exhaustive zone enumeration. Estimated 3 PRs, not 5.

No public API changes. No breaking changes.

## Capabilities

### New Capabilities

- `domain-conversions`: introduces `packages/core/src/domain/zones/` as a stable home for fitness-domain zone tables (initially the 7-band power-zone-to-percent-FTP mapping, plus any HR-zone equivalent the W6.1 audit confirms). The capability documents the public contract (helper signatures, valid input ranges, error semantics, purity) and SHALL constrain any future side-effectful behavior to migrate to `application/` with an injected port.

### Modified Capabilities

- `scripts-folder-hygiene`: extended with a new mechanical-guard requirement for stale `pnpm.overrides` (rule ID `R-OverridesStale`). The check belongs to the same family as the existing `R-ScriptsNoOrphans` rule and ships via Wave 1.5 in this change. Delta spec authored alongside this proposal — the algorithm is fully specified (deterministic, network-fail-closed) so an autonomous agent can implement it without re-asking for clarification.

## Impact

- **Affected packages**: every package (`core`, `fit`, `tcx`, `zwo`, `garmin`, `garmin-connect`, `cli`, `mcp`, `ai`, `workout-spa-editor`) plus repo-wide tooling (`.github/workflows/*`, `.husky/*`, root `package.json`, `scripts/*`).
- **Hexagonal layers touched**: Wave 6 adds new domain helpers in `packages/core/src/domain/zones/` (pure constants and conversion helpers — initially the 7-band power-zone table, plus an HR-zone table only if the W6.1 audit confirms a duplicated one; zero deps beyond `zod`). The `zwo` adapter updates one converter to import them; **`fit` and `tcx` are NOT touched by W6** because their format-specific encodings are not domain truths. No new ports. No infrastructure additions.
- **CI/CD**: new jobs for size-limit and jscpd; per-job timeouts on all existing jobs; no changes to release workflow.
- **Hooks**: pre-commit and pre-push contracts change shape (faster, narrower scope) but enforce the same invariants overall.
- **Public API**: no changes. Adapter `index.ts` re-exports remain identical.
- **Dependencies**: may add `lint-staged`, `npm-run-all2` (or equivalent), `size-limit` CLI runner in CI. No new runtime deps in any published package.
- **Round-trip tolerances**: Wave 6 must preserve current tolerances (time ±1s, power ±1W or ±1%FTP, HR ±1bpm, cadence ±1rpm). Acceptance check is the existing round-trip test suite.
- **Risk**: low–medium. Highest blast-radius unit is Wave 6 (touches three adapters and core); it is sequenced last specifically so earlier waves stabilize the safety net (size-limit, jscpd, test floor) before it runs.
- **12-factor compliance review**: `core`, `fit`, `tcx`, `zwo`, `garmin`, `ai` are pure libraries with zero `process.env` reads — factor III is already satisfied. `cli` reads only standard env signals (`CI`, `NODE_ENV`, `FORCE_COLOR`) — also compliant. `garmin-connect` has one hardcoded URL (`https://connect.garmin.com/...`) which is a contract endpoint, not config — factor IV does not apply. The only finding is in `workout-spa-editor`: `VITE_CF_ANALYTICS_TOKEN` is consumed via `import.meta.env` and gets baked into the Vite bundle at build time, breaking the env-agnostic-artifact rule (factor V) and storing config in code (factor III). Wave 1.6 fixes this. The other `import.meta.env` references (`MODE`, `DEV`, `BASE_URL`) are Vite intrinsics that legitimately belong at build time — left untouched.
