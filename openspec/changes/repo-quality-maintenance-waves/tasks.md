<!-- opsx-ship: chunking
This change ships as 26 PRs total: 25 wave PRs (W1=6, W2=3, W3=4, W4=5, W5=4, W6=3) + §7.1 closing. The orchestrator MUST treat each numbered task §N.M as one PR. The parser-smoke gate is a pre-dispatch check inside /opsx-ship itself (see design.md D13) — NOT a numbered task.

Wave boundaries and inter-wave dependencies:
  W1 (§1.1–§1.6)  Defensive walls.       6 PRs, all parallel.                                                            Depends on: nothing.
  W2 (§2.1–§2.3)  DX speedup.             3 PRs; §2.2 depends on §2.1 (both touch root package.json). §2.3 parallel.    Depends on: W1 complete.
  W3 (§3.0–§3.3)  Backend test floor.    4 PRs; §3.0 precondition for §3.1/§3.2. §3.3 parallel.                          Depends on: W1 complete.
  W4 (§4.1–§4.5)  SPA editor refactors.  5 PRs; §4.2 lands first; §4.3/§4.4/§4.5 depend on §4.2; §4.4 also depends on §4.1. Depends on: W2 + W3 complete.
  W5 (§5.1–§5.4)  SPA editor coverage.   4 PRs, all parallel.                                                            Depends on: W2 + W3 complete (NOT W4 — disjoint trees).
  W6 (§6.1–§6.3)  Domain zones extract.  3 PRs; strictly sequenced.                                                      Depends on: W4 complete.
  Closing (§7.1) Final tally + verify.   1 PR.                                                                            Depends on: §6.3.

Parser contract for /opsx-ship:
  - Section header is `## §N.M  <title>` (single source of task IDs).
  - The single checkbox under each section is the task; sub-bullets carry metadata.
  - `**Depends on:**` line lists comma-separated task IDs (or `none`).
  - `**Agent:**` names exactly one subagent type.
  - `**Scope:**` lists paths the PR is allowed to touch.
  - `**Accept:**` is the literal command(s) that prove the task is done.

Pairwise file-overlap audit (per design D11): all serializations encoded as Depends-on lines below.

Deferral protocol: if a task is deferred mid-execution, follow openspec/SPEC_TEMPLATE.md rule 6 (blank line + 2-space indent before `> Deferred to: #N`). Update the count line below at the same time.

Tasks: 0 completed, 0 deferred.
-->

## §1.1 Wire `.size-limit.json` into CI as a required check

- [ ] §1.1
  - **Agent:** cicd-guardian
  - **Scope:** `.github/workflows/ci.yml` — adds a NEW top-level peer job named `size-limit` (peer of the existing `lint:` job at `ci.yml:205`, NOT a step inside `lint:`); updates the `lint-summary` aggregator at `ci.yml:795` so its `needs:` array includes the new `size-limit` job. `.github/settings.yml` if branch-protection is managed-as-code (otherwise the PR description includes the manual GitHub UI step to add `size-limit` to required status checks).
  - **Accept:** the new `size-limit` job is a sibling of `lint:` / `test:` / `build:`, NOT a step inside any existing job; runs WITHOUT a `strategy.matrix` (single run on `node-version: 22.18.0`) — measuring a build artifact is node-version-invariant — verified by `gh run view <id> --json jobs --jq '.jobs[] | select(.name == "size-limit") | .name'` returning exactly one entry per CI run; ships with a `vars.SIZE_LIMIT_BOT_ENABLED != 'false'` kill-switch (per design D8); the `lint-summary` job's `needs:` array (line 795+) includes it; the job fails when any package exceeds its `.size-limit.json` budget; one introductory PR in this branch with a deliberately oversized fixture proves the gate fires
  - **Depends on:** none

## §1.2 Wire `.jscpd.json` into CI as a required check

- [ ] §1.2
  - **Agent:** cicd-guardian
  - **Scope:** `.github/workflows/ci.yml` — adds a NEW top-level peer job named `jscpd` (peer of `lint:` at `ci.yml:205`, NOT a step inside `lint:`); updates `lint-summary` `needs:` array at `ci.yml:795`. `.github/settings.yml` if applicable.
  - **Accept:** the new `jscpd` job is a sibling of `lint:` / `test:` / `build:`; runs WITHOUT a `strategy.matrix` (single run on `node-version: 22.18.0`) — duplication detection is node-version-invariant; ships with a `vars.JSCPD_BOT_ENABLED != 'false'` kill-switch; included in the `lint-summary` aggregator (`needs:` at `ci.yml:795+`); fails when duplication exceeds the configured 5 % threshold; `pnpm duplication` runs cleanly on the PR branch
  - **Depends on:** none

## §1.3 Add `timeout-minutes` to every job in every workflow

- [ ] §1.3
  - **Agent:** cicd-guardian
  - **Scope:** `.github/workflows/*.yml` (13 files), new `scripts/check-workflow-timeouts.mjs` + co-located `*.test.mjs`, root `package.json` (`lint:workflow-timeouts` script entry + inclusion in the parallelized lint umbrella post-W2.2)
  - **Accept:** every job in every workflow file has a `timeout-minutes` value; the new check `scripts/check-workflow-timeouts.mjs` is invocable as `node scripts/check-workflow-timeouts.mjs` and exits non-zero if any job is missing a timeout (verified by removing one timeout and observing the failure); `scripts/check-workflow-timeouts.test.mjs` covers: (a) all-timeouts-present passes, (b) missing-timeout fails, (c) malformed YAML fails, (d) workflow with no jobs (matrix-only) is tolerated; `pnpm test:scripts` passes; the timeout value per job is `min(P95 × 1.5, ceiling)` where P95 is computed from the last 20 successful runs of that job (recipe: `gh run list --workflow=<name>.yml --status=success --limit=20 --json jobs --jq '[.[].jobs[] | select(.name == "<job>") | (.completedAt | fromdate) - (.startedAt | fromdate)] | sort | .[18]'` returns the 19th of 20 sorted, i.e. the P95 in seconds — divide by 60 for minutes) AND ceiling is `{lint: 10, build: 20, test: 30, e2e: 45}` minutes by job-family — both numbers (P95×1.5 and the ceiling that applied) recorded in the PR description per workflow
  - **Depends on:** none

## §1.4 Add the four missing package READMEs

- [ ] §1.4
  - **Agent:** docs-expert
  - **Scope:** `packages/docs/README.md`, `packages/garmin-bridge/README.md`, `packages/landing/README.md`, `packages/train2go-bridge/README.md`
  - **Accept:** each of the four files exists; each includes purpose, public API or build entrypoint, and "how to test" sections; `pnpm lint:links` passes
  - **Depends on:** none

## §1.5 Audit `pnpm.overrides`; add `lint:overrides-stale` mechanical guard

- [ ] §1.5
  - **Agent:** general-purpose
  - **Scope:** root `package.json` (`overrides` audit + new `lint:overrides-stale` script entry), `scripts/check-overrides-stale.mjs` (new), `scripts/check-overrides-stale.test.mjs` (new), `scripts/README.md` (new `<!-- overrides-allowlist:start -->` / `<!-- overrides-allowlist:end -->` block), `openspec/specs/scripts-folder-hygiene/spec.md` (apply the delta from `specs/scripts-folder-hygiene/spec.md` of this change)
  - **Accept:** `pnpm test:scripts` passes; new tests cover all six scenarios in the delta spec (required, stale, allowlisted, malformed, empty/absent, network-fail-closed); `pnpm lint:overrides-stale` runs as part of `pnpm lint`; running the check on the existing 24 pinned overrides surfaces 0 stale OR each survivor has an allowlist row with a "Why kept" note; algorithm matches D5 spec (deterministic; either `pnpm why --json` walk or temp-dir lockfile-only re-resolve; network-required strategies fail closed); the canonical `openspec/specs/scripts-folder-hygiene/spec.md` first line is updated to `> Synced: <date-of-this-PR-merge> (repo-quality-maintenance-waves)` (the Synced bump belongs to this PR — NOT to §7.1 — because §1.5 is the change that actually re-verifies the spec against shipped code); `pnpm exec openspec validate --specs` passes after applying the delta
  - **Depends on:** none

## §1.6 Make `workout-spa-editor` bundle environment-agnostic across all five surfaces (12-factor III + V)

- [ ] §1.6
  - **Agent:** spa-expert
  - **Scope:** all five `VITE_CF_ANALYTICS_TOKEN` surfaces — `packages/workout-spa-editor/src/main.tsx`, `packages/workout-spa-editor/index.html`, `packages/workout-spa-editor/vite.config.ts`, `packages/workout-spa-editor/e2e/spa-route-refresh.spec.ts`, `packages/workout-spa-editor/docs/analytics.md` — plus whichever runtime-config mechanism the agent selects per design D9 (a new `packages/workout-spa-editor/public/config.json` + matching loader, or an `index.html`-templated `window.__KAIORD_CONFIG__` injected at deploy time, or removal in favor of a Cloudflare-side analytics snippet). Vite `define`/`env` is forbidden as the answer.
  - **Accept:** `grep -RnE "VITE_CF_ANALYTICS_TOKEN" packages/workout-spa-editor/src packages/workout-spa-editor/index.html packages/workout-spa-editor/vite.config.ts` returns no matches (allowed only in tests/fixtures and the rewritten docs); the production-built bundle (`packages/workout-spa-editor/dist/**/*.js`, `**/*.html`) contains no literal token value — verified by `pnpm --filter @kaiord/workout-spa-editor build && grep -RE "<any-known-prod-token-fragment>" packages/workout-spa-editor/dist`; the analytics path still works in dev (`pnpm --filter @kaiord/workout-spa-editor dev` boots and analytics initializes when a token is provided through the new runtime mechanism); SPA editor build / unit tests / e2e suite all pass; `import.meta.env.{MODE,DEV,BASE_URL}` references are left untouched (legitimate Vite intrinsics, not config); docs/analytics.md is rewritten to describe the runtime-injection pattern, not build-time embed
  - **Depends on:** none

## §2.1 Convert pre-commit hook to lint-staged on changed files; move `pnpm build` out of pre-commit entirely

- [ ] §2.1
  - **Agent:** cicd-guardian
  - **Scope:** `.husky/pre-commit`, root `package.json` (devDependency `lint-staged` + `lint-staged` config block); explicitly REMOVES the `pnpm build` step from pre-commit (build moves to CI only — it already runs there)
  - **Accept:** new pre-commit shape is exactly: `lint-staged` (file-scoped checks: eslint --fix --max-warnings=0 on `*.{ts,tsx}`; prettier --check on `*.{md,json,yml}`; the test-AAA / test-title-should `--changed-files` modes for staged `*.test.{ts,tsx}`) → `pnpm test:scripts` (full-tree mechanical guards: R-LibraryNoDualMount, R-ScriptsNoOrphans, R-AppDexieImport, etc. — `test:scripts` already runs in <5s) → `pnpm -r exec tsc --noEmit --incremental`; **`pnpm build` is no longer in pre-commit** (it stays in CI); the PR description records BOTH `time git commit` measurements: BEFORE the change (current `.husky/pre-commit` runs `pnpm build` + `pnpm -r exec tsc --noEmit` + `pnpm test:scripts` + `pnpm test`, expected ~2–3 min on a warm cache) and AFTER (target <30s) — the win is the delta, not the absolute number; deliberately introducing an existing whole-tree-only violation (R-LibraryNoDualMount: import `WorkoutLibrary` from a third file outside `LibraryPage.tsx` / `TemplatePickerDialog.tsx`) still blocks the commit (verifies `pnpm test:scripts` retention); deliberately breaking a file-scoped guard (e.g. PII interpolation in a toast) still blocks the commit; tsc incremental cache warmth verified by checking each `tsconfig.json` either inherits or sets `compilerOptions.tsBuildInfoFile`, and the resulting `.tsbuildinfo` files are gitignored
  - **Depends on:** §1.1, §1.2, §1.3

## §2.2 Parallelize `pnpm lint` per the ordering matrix in design D10

- [ ] §2.2
  - **Agent:** cicd-guardian
  - **Scope:** root `package.json` (`scripts.lint`), devDependency `npm-run-all2`
  - **Accept:** `pnpm lint` completes ≥ 2× faster than the pre-PR baseline on a warm cache (PR description includes timing before/after); the parallel group and post-group exactly match design D10 (parallel: 15 + 2 new from W1.3/W1.5 = 17 checks plus per-package `pnpm -r lint`; post: `lint:archive-index`, `lint:archive-followups`); invoked with `npm-run-all2 -p --max-parallel=4 --aggregate-output` per design D7 to cap workers and keep per-process output contiguous; the PR description includes the output of `for i in $(seq 1 20); do time pnpm lint || echo FAIL >&2; done` showing 20 successes in a row and stable timing (max − min < 30 % of mean) — proves no race-flakes from the parallelization
  - **Depends on:** §2.1, §1.1, §1.2, §1.3

## §2.3 Replace `pre-push lint:fix` with `pre-push lint` (verify-only, no writes)

- [ ] §2.3
  - **Agent:** cicd-guardian
  - **Scope:** `.husky/pre-push` only
  - **Accept:** `.husky/pre-push` runs `pnpm lint` (read-only), never `pnpm lint:fix`; on a clean tree, push leaves the working tree clean (`git status --porcelain` empty after a successful push); on a tree with lint errors, push aborts with an explicit "run `pnpm lint:fix` yourself" message — the hook does not write to the working tree
  - **Depends on:** §1.1, §1.2, §1.3

## §3.0 Precondition: confirm vitest coverage tooling is wired in `core` and `garmin`

- [ ] §3.0
  - **Agent:** test-improver
  - **Scope:** `packages/core/package.json`, `packages/garmin/package.json` (`scripts.test:coverage`), `packages/core/vitest.config.ts`, `packages/garmin/vitest.config.ts` (coverage `thresholds` block per CLAUDE.md: 80 % line + branch + function for both — backend packages)
  - **Accept:** discovery + setup performed in this order: (a) read `packages/core/vitest.config.ts` and `packages/garmin/vitest.config.ts`; (b) record whether each has a `coverage.thresholds` block today; (c) if absent, ADD one set to `{ lines: 80, branches: 80, functions: 80, statements: 80 }` as part of THIS PR; (d) if present but lower than 80, raise to 80; (e) if present at 80+, leave intact and note the baseline in the PR description; (f) confirm `scripts.test:coverage` script exists in each package's `package.json` and add it if missing (the canonical command is `vitest --run --coverage`). After discovery: `pnpm --filter @kaiord/core test:coverage` produces a coverage report with thresholds enforced; same for `@kaiord/garmin`; current coverage values recorded in PR description as the baseline; **if the baseline already passes 80 % across all four metrics, §3.1 is downgraded to a no-op** — its tasks.md entry MUST be marked `> Deferred to: <already at threshold>` per the deferral protocol AND the closing §7.1 reflects this in the `Tasks: <C> completed, <D> deferred` line; same rule for §3.2 vs `@kaiord/garmin`. The baseline run is the determinant — if at threshold, do not manufacture synthetic tests just to "do something"
  - **Depends on:** §1.1, §1.2, §1.3

## §3.1 Lift `core` coverage to ≥ 80 % line + branch + function

- [ ] §3.1
  - **Agent:** test-improver
  - **Scope:** `packages/core/**` (source files MUST NOT change; only new `*.test.ts` files added under `packages/core/src/`)
  - **Accept:** `pnpm --filter @kaiord/core test:coverage` reports ≥ 80 % line, ≥ 80 % branch, ≥ 80 % function per CLAUDE.md; new tests follow R-ItTitleShould and R-ItBodyAAA — verified by running `node scripts/check-test-aaa.mjs` and `node scripts/check-test-title-should.mjs` in full-tree mode at the end of the PR (NOT the `--changed-files` mode); `pnpm test:scripts` passes
  - **Depends on:** §3.0

## §3.2 Lift `garmin` coverage to ≥ 80 % line + branch + function

- [ ] §3.2
  - **Agent:** test-improver
  - **Scope:** `packages/garmin/**` (source unchanged; only new `*.test.ts`)
  - **Accept:** `pnpm --filter @kaiord/garmin test:coverage` ≥ 80 % line / branch / function; tests follow R-ItTitleShould and R-ItBodyAAA (full-tree mode verified via `node scripts/check-test-aaa.mjs && node scripts/check-test-title-should.mjs`); `pnpm test:scripts` passes
  - **Depends on:** §3.0

## §3.3 Split oversized backend files (>100 LOC)

- [ ] §3.3
  - **Agent:** complexity-reducer
  - **Scope:** `packages/fit/src/adapters/krd-to-fit/krd-to-fit-metadata.converter.ts` (120 LOC), `packages/tcx/src/adapters/target/tcx-to-krd.converter.ts` (111 LOC), `packages/zwo/src/adapters/interval/steady-state.mapper.ts` (106 LOC), `packages/cli/src/commands/garmin/yargs-config.ts` (107 LOC), `packages/cli/src/commands/convert/single-file.ts` (107 LOC)
  - **Accept:** every file in scope ≤ 100 LOC; every function ≤ 40 LOC; existing tests still pass for each touched package (`pnpm --filter @kaiord/fit test`, `pnpm --filter @kaiord/tcx test`, `pnpm --filter @kaiord/zwo test`, `pnpm --filter @kaiord/cli test`); round-trip tests still pass (`pnpm --filter @kaiord/fit test:roundtrip`, etc., where they exist); public exports of each adapter `index.ts` are byte-identical to pre-PR (`git diff packages/{fit,tcx,zwo}/src/index.ts` shows no change)
  - **Depends on:** §1.1, §1.2, §1.3

## §4.1 Extract shared repetition-block / step mutation helpers

- [ ] §4.1
  - **Agent:** complexity-reducer
  - **Scope:** `packages/workout-spa-editor/src/store/actions/{add-step-to-repetition-block,delete-repetition-block,ungroup-repetition-block,edit-repetition-block,create-empty-repetition-block,duplicate-step}-action.ts`; new helpers under `packages/workout-spa-editor/src/store/actions/_helpers/`; corresponding tests
  - **Accept:** `pnpm duplication` (jscpd) reports < 50 LOC of duplication across these six files (down from ~100); each action file ≤ 100 LOC; existing action tests still pass; `pnpm test:scripts` still passes (R-DexieImport, R-PersistStateImport unaffected)
  - **Depends on:** §2.1, §2.2, §2.3, §3.1, §3.2, §3.3

## §4.2 Split `src/types/index.ts` (172 LOC) into domain-scoped barrels — lands FIRST in W4 to minimize merge conflicts

- [ ] §4.2
  - **Agent:** complexity-reducer
  - **Scope:** `packages/workout-spa-editor/src/types/index.ts`, new files under `packages/workout-spa-editor/src/types/{workout,profile,sync,ui}.ts`, all import sites that pull from `~/types` or `src/types`
  - **Accept:** `src/types/index.ts` ≤ 60 LOC and is a pure re-export barrel; per-domain files each ≤ 100 LOC; SPA editor build green (`pnpm --filter @kaiord/workout-spa-editor build`); SPA editor tests green; no TS error from import-path drift
  - **Depends on:** §2.1, §2.2, §2.3, §3.1, §3.2, §3.3

## §4.3 Split `CalendarPage.tsx` (156 LOC, 10+ hooks) into a coordinating hook + view

- [ ] §4.3
  - **Agent:** complexity-reducer
  - **Scope:** `packages/workout-spa-editor/src/components/pages/CalendarPage.tsx`, new co-located `use-calendar-page.ts` (or `useCalendarPage.ts`), new co-located test for the hook
  - **Accept:** `CalendarPage.tsx` ≤ 60 LOC; the new coordinating hook ≤ 100 LOC; the hook is unit-tested with at least one positive-flow scenario, one auto-match-suggestion scenario, and one no-active-profile fallback scenario (organism-hooks pattern); SPA editor build green; SPA editor e2e suite green
  - **Depends on:** §2.1, §2.2, §2.3, §3.1, §3.2, §3.3, §4.2

## §4.4 Build a workout-store selector registry

- [ ] §4.4
  - **Agent:** complexity-reducer
  - **Scope:** `packages/workout-spa-editor/src/store/workout-store-selectors.ts` (split), `use-keyboard-store-selectors.ts`, `use-context-menu-store.ts`, all 60+ selector callsites
  - **Accept:** each selector file ≤ 100 LOC; selectors exported through a single entry barrel `src/store/selectors/index.ts`; selector callsite imports flow through the barrel; SPA editor build green; SPA editor tests green
  - **Depends on:** §2.1, §2.2, §2.3, §3.1, §3.2, §3.3, §4.1, §4.2

## §4.5 Right-size remaining files over budget

- [ ] §4.5
  - **Agent:** complexity-reducer
  - **Scope:** `packages/workout-spa-editor/src/adapters/dexie/dexie-database.ts` (140 LOC), `src/utils/save-workout.ts` (123 LOC), `src/utils/profile-storage.ts` (114 LOC), `src/components/pages/WorkoutSection/use-repetition-block-handlers.tsx` (118 LOC)
  - **Accept:** every file in scope ≤ 100 LOC; every function ≤ 40 LOC (60 for components); existing tests still pass; `R-DexieImport`, `R-PersistStateImport`, `R-AppDexieImport` still satisfied
  - **Depends on:** §2.1, §2.2, §2.3, §3.1, §3.2, §3.3, §4.2

## §5.1 Tests for `components/organisms/ZoneEditor/hooks/*`

- [ ] §5.1
  - **Agent:** test-improver
  - **Scope:** `packages/workout-spa-editor/src/components/organisms/ZoneEditor/hooks/**` (only new `*.test.ts`/`.test.tsx` files)
  - **Accept:** every hook file under `ZoneEditor/hooks/` has a co-located `.test.tsx` or `.test.ts`; every test file passes R-ItTitleShould and R-ItBodyAAA in full-tree mode (`node scripts/check-test-aaa.mjs && node scripts/check-test-title-should.mjs`); aggregate coverage of `ZoneEditor/hooks/` ≥ 70 % line / branch / function (CLAUDE.md frontend threshold — the gap to backend's 80 % is intentional policy, tracked as a future tightening); test files import types via the `~/types` barrel only (never deep imports into `~/types/<sub>`) — verified by `grep -RnE "from ['\"]~/types/" packages/workout-spa-editor/src/components/organisms/ZoneEditor/hooks` returning no matches
  - **Depends on:** §2.1, §2.2, §2.3, §3.1, §3.2, §3.3

## §5.2 Tests for `components/organisms/ProfileManager/hooks/*`

- [ ] §5.2
  - **Agent:** test-improver
  - **Scope:** `packages/workout-spa-editor/src/components/organisms/ProfileManager/hooks/**`
  - **Accept:** every hook file has a co-located test; full-tree AAA + title compliance verified; coverage of `ProfileManager/hooks/` ≥ 70 % line / branch / function; test files use `~/types` barrel only (`grep -RnE "from ['\"]~/types/" packages/workout-spa-editor/src/components/organisms/ProfileManager/hooks` returns no matches)
  - **Depends on:** §2.1, §2.2, §2.3, §3.1, §3.2, §3.3

## §5.3 Tests for `components/organisms/WorkoutLibrary/components/*`

- [ ] §5.3
  - **Agent:** test-improver
  - **Scope:** `packages/workout-spa-editor/src/components/organisms/WorkoutLibrary/components/**`
  - **Accept:** every component file has a co-located test; full-tree AAA + title compliance verified; coverage of `WorkoutLibrary/components/` ≥ 70 %; `R-LibraryNoDualMount` still satisfied; test files use `~/types` barrel only (`grep -RnE "from ['\"]~/types/" packages/workout-spa-editor/src/components/organisms/WorkoutLibrary/components` returns no matches)
  - **Depends on:** §2.1, §2.2, §2.3, §3.1, §3.2, §3.3

## §5.4 Tests for `components/organisms/WorkoutList/hooks/*` (incl. `use-workout-list-dnd.ts`)

- [ ] §5.4
  - **Agent:** test-improver
  - **Scope:** `packages/workout-spa-editor/src/components/organisms/WorkoutList/hooks/**`
  - **Accept:** every hook file has a co-located test; tests cover drag, drop, cancel, and reorder paths; full-tree AAA + title compliance verified; coverage of `WorkoutList/hooks/` ≥ 70 %; test files use `~/types` barrel only (`grep -RnE "from ['\"]~/types/" packages/workout-spa-editor/src/components/organisms/WorkoutList/hooks` returns no matches)
  - **Depends on:** §2.1, §2.2, §2.3, §3.1, §3.2, §3.3

## §6.1 Extract zone tables to `core/src/domain/zones/` with exhaustive + property-based tests

- [ ] §6.1
  - **Agent:** architecture-guardian
  - **Scope:** new `packages/core/src/domain/zones/power-zones.ts`, optional `packages/core/src/domain/zones/hr-zones.ts` (only if the W6.1 grep audit confirms a duplicated HR table — see design D2 sub-agent contract; the helper's zone count is whatever the audit dictates, NOT a presupposed 5-band model — the spec scenarios must match the helper's actual domain), co-located `*.test.ts` siblings (must include exhaustive enumeration; property-based tests via `fast-check` are optional for the 7-element power-zone domain — see Accept), `packages/core/src/index.ts` re-exports, root `package.json` (devDependency `fast-check` ONLY if the property-based path is taken); apply the delta from `specs/domain-conversions/spec.md`; create the canonical post-archive spec at `openspec/specs/domain-conversions/spec.md` with the following exact preamble (then merge in the delta's Requirements):

    ```
    > Synced: <date-of-this-PR-merge> (repo-quality-maintenance-waves)

    # Domain conversions

    ## Purpose

    Provides pure, side-effect-free fitness-domain conversion helpers (initially the 7-band power-zone-to-percent-FTP table) used by adapter packages to translate between discrete zone numbers and the continuous quantities they represent. Helpers SHALL stay under `domain/` and SHALL NOT acquire I/O; if a future change requires side effects, the work moves to `application/` with an injected port.

    ## Requirements

    <merge in the two ADDED Requirements from the change-folder delta verbatim>
    ```
  - **Accept:** pure domain modules with zero external imports beyond `zod` (and `fast-check` only if the property-based path is taken; test-only); each helper has unit tests covering: **exhaustive enumeration** over every integer zone in the valid range as defined by the helper itself (7 for power per Coggan — exhaustive enumeration is mathematically complete for a 7-element domain; HR-zone count determined by the audit if shipped); boundary inputs (`0`, `max+1`, `-1`, `NaN`, `Infinity`, non-integers like `1.5`); a `fast-check` property-based suite (≥ 100 generated cases) is OPTIONAL for the power domain (no theoretical added value over exhaustive enumeration) but RECOMMENDED for the HR domain if it ships with a wider valid range — the PR description names which path was taken and why; per-file coverage on `domain/zones/**` ≥ 95 % line / branch / function — verified by running `pnpm --filter @kaiord/core test -- --coverage --coverage.include='src/domain/zones/**' --coverage.thresholds.lines=95 --coverage.thresholds.branches=95 --coverage.thresholds.functions=95` (CLI overrides the package-level 80 % threshold for this scope only); alternatively, a `node scripts/check-zones-coverage.mjs` parses `coverage/coverage-final.json` and asserts the per-file numbers (either is acceptable; the PR description names which); `pnpm lint:architecture` (alias `pnpm arch:check` if desired) reports 0 errors; `pnpm exec openspec validate --specs` passes after applying the delta AND creating the canonical post-archive spec with the verbatim `## Purpose` block above; published API of `@kaiord/core` adds new exports only (no removals, no signature changes to existing exports — verified by `git diff packages/core/src/index.ts | grep -E "^-export"` empty) — this qualifies as a `minor` bump per SemVer §7; the PR description includes a grep audit (`grep -RnE "<zone-table-fingerprint>" packages/`) listing every site that holds equivalent logic, confirming `zwo` is the only adapter to migrate (or, if FIT/TCX surface unexpected sites, halting the wave for re-scoping per design D2 sub-agent contract); a changeset entry for `core` (`minor`) is added under `.changeset/`; the canonical `openspec/specs/domain-conversions/spec.md` Synced marker bears the merge date of THIS PR (not §7.1)
  - **Depends on:** §4.1, §4.2, §4.3, §4.4, §4.5

## §6.2 Migrate `zwo` to use the new core helpers

- [ ] §6.2
  - **Agent:** architecture-guardian
  - **Scope:** `packages/zwo/src/adapters/target/power.converter.ts` (replace local `convertPowerZoneToPercentFtp` with the import from `@kaiord/core`); other zwo files unchanged
  - **Accept:** `packages/zwo/src/adapters/target/power.converter.ts` no longer holds an inline zone table; the corresponding logic comes from `@kaiord/core` via `import`; `pnpm --filter @kaiord/zwo test` passes; `pnpm arch:check` 0 errors; cross-adapter imports remain forbidden (`pnpm exec depcruise packages/zwo/src --config .dependency-cruiser.cjs` shows no `@kaiord/fit` or `@kaiord/tcx` imports); `git diff packages/zwo/src/index.ts` shows no changes (public API stable)
  - **Depends on:** §6.1

## §6.3 Round-trip + property-based verification across the migrated state

- [ ] §6.3
  - **Agent:** validate-roundtrip
  - **Scope:** read-only — runs the existing round-trip suites and the new property-based suite; only PR scope is the changeset entry and (if any tolerance has actually improved) the threshold value
  - **Accept:** `pnpm -r test:roundtrip` passes within current tolerances (time ±1s, power ±1W or ±1%FTP, HR ±1bpm, cadence ±1rpm); since W6 only touched `zwo` (per design D2), the only test family that could reflect a W6 regression is the ZWO round-trip matrix — if any FIT-only or TCX-only round-trip fails, that failure is **pre-existing** and §6.3 is NOT the right PR to fix it (open a separate issue and do not block §6.3 on it); `pnpm --filter @kaiord/core test -- zones` shows the exhaustive-enumeration suite green for every helper that ships, plus the property-based suite if W6.1 took that path; if any tolerance has tightened in practice, the PR description proposes the new value (do not auto-tighten)
  - **Depends on:** §6.2

## §7.1 Closing — confirm `/opsx-archive` readiness

- [ ] §7.1
  - **Agent:** general-purpose
  - **Scope:** `openspec/changes/repo-quality-maintenance-waves/tasks.md` (mark all checkboxes complete; final tally update); read-only audit elsewhere (no spec or code edits — Synced markers were bumped by the PRs that re-verified each spec: §1.5 for `scripts-folder-hygiene`, §6.1 for `domain-conversions`)
  - **Accept:** every checkbox above is checked; the chunking-block `Tasks: <C> completed, <D> deferred` line is updated with the final tally; the SPEC_TEMPLATE rule 7 top-level `> Tasks: <C> completed, <D> deferred` blockquote (if used per the deferral protocol; both placements are kept in sync if both are used) reflects the same numbers; the canonical `openspec/specs/scripts-folder-hygiene/spec.md` Synced marker is dated within the §1.5 PR's merge window (not later); the canonical `openspec/specs/domain-conversions/spec.md` Synced marker is dated within the §6.1 PR's merge window (not later); `pnpm exec openspec validate repo-quality-maintenance-waves --strict` passes; `pnpm lint` passes; `pnpm -r test` passes; `pnpm -r build` passes; ready to invoke `/opsx-archive repo-quality-maintenance-waves` (the DRI runs `/opsx-archive` after this §7.1 PR merges — the archive is NOT auto-triggered by §7.1 completion)
  - **Depends on:** §6.3
