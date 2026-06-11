# Design: test-minimality-naming-hardening

## Context

A seven-agent audit (2026-06-11) produced per-finding evidence with file:line references for every package. The findings fall into four buckets: redundant tests (~900–1,200 deletable `it()` blocks), genuine coverage gaps hidden by that redundancy, misleading test names, and a concentrated set of identifier-naming defects. The audit reports currently live in `/tmp/audit-*.md` and are ephemeral; they are the evidence base for every deletion in this change.

Everything in scope sits in the **adapters layer** (format adapters, CLI/MCP surfaces, SPA components) plus `scripts/` tooling. No domain types, application use cases, or port contracts change, so no port interface needs to be specified ahead of any adapter work.

## Goals / Non-Goals

**Goals:**

- A strictly smaller test suite that proves strictly more (gaps filled before duplicates deleted).
- One canonical TCX target/duration encoding path, with the running-cadence and pace-unit behavior asserted on it.
- Internal naming that honors the repo's own conventions (mapper-has-no-logic, kebab-case files, pronounceable identifiers).
- A mechanical guard so the barrel-duplicate-suite pattern cannot regress.

**Non-Goals:**

- No public API changes, no new ports, no new external dependencies.
- No blanket rewrite of SPA component tests — only the audit-named files/patterns.
- No mechanical guard for "vacuous assertion" or "semantic title" (not reliably machine-checkable; these stay review-enforced requirements in the spec).
- No changes to the existing title-`should`/AAA guards (`test-conventions` is untouched).

## Decisions

### D1 — Snapshot the audit evidence into the change directory

Copy the seven `/tmp/audit-*.md` reports to `openspec/changes/test-minimality-naming-hardening/audit/` (renamed by area: `core.md`, `fit.md`, `adapters.md`, `cli-mcp.md`, `spa.md`, `naming-core.md`, `naming-spa.md`). Every deletion task references its finding; reviewers never have to trust memory. _Alternative considered:_ linking the audit summary only — rejected, file:line evidence is what makes batch deletions reviewable.

### D2 — Gaps first, deletions second (coverage-monotonic ordering)

New tests (core round-trip helpers with a real `ToleranceChecker`, `validate-krd`, SPA clipboard-store, MCP health `skipped` cases, CLI invalid-format/TCX/ZWO e2e) land **before** any redundant test is deleted. Coverage per package must be non-decreasing on `src/` lines at every commit; thresholds (80% core / 70% frontend) stay enforced. This makes each deletion provably safe instead of "probably safe".

### D3 — TCX pipeline: keep the live path, delete the orphan chain

Layer: `@kaiord/tcx` adapters. The wired path is `workout/step-to-tcx.converter.ts` → `workout/target-to-tcx.converter.ts` and `duration/duration-walker.converter.ts`; the orphan chain (`target/krd-to-tcx.converter.ts`, `target/{pace,cadence,heart-rate}.converter.ts`, `duration/{tcx-to-krd,standard-duration,extended-duration}.converter.ts` + barrels) is imported by no production code. Delete the orphans and their suites. **Precondition (hard gate):** verify via the package entry point (`src/index.ts`) that none of the orphan modules is re-exported publicly; if any is, stop and re-scope that module as a deprecation instead of a deletion. _Alternative considered:_ wiring in the orphan chain (it has the richer tests) — rejected: the live path is what every existing round-trip and integration test already validates; swapping pipelines is a far bigger behavioral risk than porting two behaviors.

### D4 — Running-cadence doubling is a spec question, answered before porting

The orphan `cadence.converter.ts` doubles running cadence (rpm → strides/min); the live path does not. Whether doubling is _correct_ must be confirmed against the TCX schema semantics (`Cadence_t` vs `RunCadence`) and what Garmin Connect actually exports, using the existing TCX fixtures. The confirmed behavior becomes the `adapter-contracts` delta requirement and a live-path round-trip test (tolerance ±1 rpm). If doubling turns out to be wrong, the delta spec asserts pass-through instead — either way the live path gains an explicit assertion. This is the one finding where tests currently green-light divergent behavior.

### D5 — Barrel guard: `scripts/check-no-barrel-test-suites.mjs`

For every `*.test.{ts,tsx}` under `packages/**` (same scope/exclusions as the title guard), resolve the subject module (same path minus `.test`). If the subject file consists solely of `export ... from` / `export type ... from` statements (comments and blank lines ignored), report rule `R-NoBarrelTestSuite` and exit non-zero. Follows the house pattern: co-located `*.test.mjs` (node:test), `--changed-files` mode, one-line stderr format with rule id, wired into `pnpm test:scripts` (pre-commit + CI). An allowlist ratchet is unnecessary — after this change the violation count is zero. _Alternative considered:_ detecting duplicate assertions across files — rejected as unreliable; the barrel shape is the mechanically crisp 80% of the problem.

### D6 — Renames are pure refactors, executed with TS-aware tooling

Layer: adapter internals only; nothing renamed is part of a public surface.

- garmin-connect: `s`→`state`, `o1`/`o2`→`oauth1Token`/`oauth2Token`, `doRefresh`→`refreshTokens`, `res`→`response`, `opts`→`options` (and fix the `options`→`opts` alias inside `withRetry`).
- zwo: `duration.mapper.ts`→`duration.converter.ts`, `steady-state.mapper.ts`→`steady-state.converter.ts`. Renaming to `.converter.ts` makes them subject to `check-converter-has-tests.mjs`; their behavior is already covered (round-trip + `text-event-extraction.test.ts`), so the existing tests are re-pointed/renamed to satisfy the guard rather than writing new ones. This simultaneously resolves the audit's "tests on mapper files" finding.
- garmin: move `mappers/target.converter.ts` → `converters/target.converter.ts` and rename `mapGarminTargetToKrd`/`mapKrdTargetToGarmin` → `convertGarminTargetToKrd`/`convertKrdTargetToGarmin` (folder, suffix, and prefix then agree).
- SPA: `useToast.ts`, `useAppHandlers.ts`, `useDeleteCleanup.ts`, `useKeyboardShortcuts.ts` + `useToast.helpers.ts`/`useToast.types.ts` → kebab-case, imports updated.

### D7 — SPA test collapse is pattern-scoped, not a sweep

Only the audit-named targets: `it.each` collapse for Badge/Button/Toast variant maps, the five WorkoutLibrary filter selects, LayoutHeader entry buttons; delete `delete-button-styling.test.tsx` and `store/test-delete-exists.test.ts`; fold CardShell visual-contract token assertions into `status-tokens.test.ts`; one mount-clean test per Sortable component (drop the dnd-kit prop-leak test); replace Tailwind-class assertions with role/text/testid assertions in the touched files. The `lib/`, `store/actions/`, and `application/` suites are explicitly untouchable (audit grade A). Estimated reduction lands at the conservative end (~550 cases) rather than chasing the maximum.

### D8 — Fit dispatcher tests become routing-only

`target/target.converter.test.ts` and `duration/duration.converter.test.ts` shrink to one routing assertion per dispatcher branch, using `krd-to-fit/krd-to-fit-target.converter.test.ts` as the in-repo template; leaf suites keep value-logic ownership. Fake "round-trip" files are renamed (`daily-round-trip` → `daily-fit-to-krd`, same for stress) or deleted (`round-trip-duration.test.ts`, fully subsumed). The false "conversion not implemented" title is renamed to the real behavior.

### D9 — Commit/PR strategy

One feature branch, one PR, commits grouped per package area (core, fit, tcx+zwo, garmin\*+ai, cli+mcp, spa, naming, guard+spec) so each commit is independently green and revertable. Patch changesets for every published package whose files change (`tcx` gets a `fix:` changeset if D4 changes live-path output; everything else `chore:`/test-only — changeset only where the published artifact actually changes).

## Risks / Trade-offs

- [Deleting a test that covered a unique branch] → D2 ordering + per-commit non-decreasing coverage diff; every deletion cites an audit finding that names the surviving owner test.
- [Orphan tcx modules are actually re-exported publicly] → D3 hard gate before deletion; escalate to deprecation if hit.
- [Cadence doubling ported but wrong] → D4 resolves semantics from schema + fixtures _before_ porting; the delta spec records the decision either way.
- [zwo mapper→converter rename trips `check-converter-has-tests`] → handled in D6 by re-pointing existing behavior tests as the co-located suites.
- [Large SPA diff churn] → D7 pattern-scoping; no file outside the audit list is touched.
- [`it.each` collapses accidentally weaken discrimination] → each collapse must keep one row per former `it()` (same inputs, same assertions), only the structure changes.

## Migration Plan

Not applicable — no breaking API change. Rollback is per-commit revert (D9 guarantees each commit is green).

## Open Questions

- TCX running-cadence semantics (D4): doubling vs pass-through — resolved during implementation from the TCX XSD and Garmin-exported fixtures; blocks only the cadence task, nothing else.
- MCP `BINARY_FORMATS` duplicate source of truth (hardcoded set vs `FORMAT_REGISTRY`): derive it from the registry as a drive-by, or leave as-is? Default: derive (one-line change, removes a dual-truth risk the audit flagged).
