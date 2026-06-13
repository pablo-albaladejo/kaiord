I have comprehensive evidence across all dimensions. Here are my findings.

---

## Semantic Quality & Business-Language Audit — `workout-spa-editor` logic layers

Scope: ~26 deep-read files across `lib/`, `store/actions/`, `application/coaching/`, `hooks/` plus a numeric-literal sweep. Tests, identifier spelling, and markup excluded.

### Findings

- [SUGGESTION] [rules] `store/actions/clear-expired-deletes-action.ts:14` — the undo-delete window is an inline local `const EXPIRY_TIME = 5000; // 5 seconds`, while the **same** 5s window is independently re-encoded as `duration: 5000` in `use-delete-step-with-toast.tsx:32`, `delete-block-with-toast.tsx:25`, and narrated in `use-delete-cleanup.ts:5`'s comment and its `setInterval(…, 1000)`. — Three+ call sites that MUST agree (the toast that offers "Undo" must out-live the in-memory `deletedSteps` retention) share no named constant; the editor invariant "the undo affordance is live for 5s" is not expressed anywhere as one rule. — Extract `UNDO_DELETE_WINDOW_MS = 5000` (and `CLEANUP_TICK_MS = 1000`) into a shared `store/actions` constants module and import it into the toast `duration` and the expiry filter, so the rule reads once.

- [SUGGESTION] [types] `store/actions/extract-workout.ts:15` + 13 sibling action files — `extractStructuredWorkout` exists and centralizes the `extensions.structured_workout as Workout` cast + early-return guard, yet `create-step-action.ts:21`, `undo-delete-action.ts:35`, `delete-step-action.ts:28`, `reorder-step-action.ts:66`, `paste-step-action.ts:41` each re-do the raw `as Workout` cast inline (18 occurrences / 14 files). — The KRD→Workout boundary is a domain-type narrowing that the helper already names; bypassing it scatters an unchecked cast and duplicates the "no-op on non-structured" rule. — Route every action through `extractStructuredWorkout(krd)` (the duplicate/block actions already do via `_helpers`); verify with `grep -c "structured_workout as Workout" store/actions` trending to the single helper site.

- [SUGGESTION] [types] `store/actions/create-step-action.ts:24` — the freshly created `newStep.id` is a bare `defaultIdProvider()` with no `ItemId` brand, whereas `duplicate-step-action.ts:38` (`WorkoutStep & { id: ItemId }`), `reorder-step-action.ts:95`, and `undo-delete-action.ts:75` all carefully re-assert the `ItemId` brand before handing the id to `createdItemTarget`. — Inconsistent honesty about the branded-id domain type across the four sibling create/mutate actions; a reader cannot tell from `create-step-action` that the id is the same focus-addressable `ItemId` contract. — Type `newStep` as `… & { id: ItemId }` (or have `defaultIdProvider` return `ItemId`) so all creation paths speak the same id vocabulary.

- [SUGGESTION] [state] `hooks/use-activity-match-state.ts:20-51` and `hooks/use-matched-sessions-hydrate.ts:12-55` — these hooks `import { db }` and issue raw `db.table<…>(…).where(…)` Dexie queries inline, whereas the parallel application use cases (`ensure-session-match.ts`, `heal-session-match-id-shape.ts`, `auto-match-sessions.ts`) are pure and reach persistence only through injected `*Repository` ports. — Persistence plumbing (table names, index tuple `[profileId+coachingActivityId]`, `anyOf`) lives directly in the hook body, mixing the Dexie tier with the read-model decision; ~20 hooks touch `db`/`usePersistence`, so the tier boundary is blurrier in `hooks/` than the strict ports discipline in `application/`. — Acceptable for thin `useLiveQuery` read projections, but the multi-query join in `hydrateMatchedSessions` reads as a small repository — consider a `matchedSessionsRepository.hydrate(matches)` port so the hook expresses intent, not SQL-shaped Dexie. (Note: the mechanical guard only bans Zustand→Dexie writes; this is read-side semantic clarity.)

- [SUGGESTION] [rules] `application/auto-match-sessions.ts:7` vs `auto-match-candidate.ts:21` — the doc comment states "duration variance within ±20% (score ≥ 0.6)", but the `±20%` figure appears **nowhere** in code: the filter is purely `score >= SCORE_THRESHOLD (0.6)` and the score is `1 - |Δ|/plan`, so 0.6 corresponds to ±40%, not ±20%. — The narrated business rule and the executable rule disagree; a maintainer trusting the comment would mis-state the matching tolerance to users/support. — Either correct the comment to "score ≥ 0.6 (≈ ±40% duration variance)" or add a named `MAX_DURATION_VARIANCE` if ±20% is the true intent; verify against `computeComplianceScore`'s definition.

- [SUGGESTION] [process] `hooks/use-coaching-auto-sync.ts:50-62` — the staleness-gated week sync runs sources in a `for … await` loop inside a bare `void (async () => {…})()` IIFE with no per-iteration narrative state (no "syncing source N", no aggregate outcome). — The Train2Go auto-sync orchestration reads as fire-and-forget rather than a process with explicit states; failures are swallowed into `runSourceSync`'s analytics with no visible completion signal at this level. — Acceptable given the "silent auto-sync" product rule, but consider returning/recording a small `{ source, outcome }[]` for legibility and future observability.

### Exemplary spots

- `application/batch-processor.ts:1-79` — model process narrative: header states the contract ("continue-on-failure, 500ms cadence, retry budget 3"), `CADENCE_MS`/`MAX_BATCH_RETRIES` named, per-workout `byId` state machine (`queued→processing→succeeded/failed`) reads as the business flow.
- `types/coaching-activity-record.ts:65-104` — the composite-id rule is fully readable: `buildCoachingActivityId`, `toPersistedCoachingActivityId`, `namespaceSourceId` each documented, the Zod `.refine` enforces `id === ${profileId}:${source}:${sourceId}`, and the SHORT↔COMPOSITE asymmetry is explained in one place. Primitive-obsession around ids is well contained.
- `application/auto-match-dismissal.ts` + `-helpers.ts` — dedup/cap rule is named (`DISMISSED_PAIRS_CAP = 256`), scoping `(profileId, weekStart, activityId, workoutId)` documented, "re-dismiss updates in place and doesn't count toward cap" stated and matched by `upsertPair`.
- `store/workout-store-history.ts:4` — `MAX_HISTORY_SIZE = 50` named, overflow-trim logic clear, and the header explains the structural single-array invariant replacing parallel arrays.
- `lib/workout-review/estimate-tss.ts` + `classify-zone.ts` + `intensity-factor.ts` — zone/TSS math uses named constants (`SECONDS_PER_HOUR`, `TSS_SCALE`, `ZONE_MIDPOINTS`, `MAX_ZONE`) and shared `classifyAscending`; the TSS formula and its symmetry/limitations are documented.
- `hooks/use-sync-engine.ts` — the three-tier rule is stated explicitly in the header ("ephemeral sync status in React state… never reads/writes Dexie… all I/O through ports… never a Zustand store"); debounce via named `PUSH_DEBOUNCE_MS`, unmount-cancel handled.
- `application/coaching/ensure-session-match.ts` + `convert-coaching-activity-with-ai.ts` — both read as single user-intent narratives at one abstraction level, with the three-branch convert contract and the concurrent-write/`SessionAlreadyMatchedError` tolerance spelled out.

### Grades

| Dimension                                        | Grade |
| ------------------------------------------------ | ----- |
| Business-rule legibility (rules)                 | A−    |
| Abstraction level in actions/hooks (abstraction) | A−    |
| State-vocabulary honesty (state)                 | B+    |
| Domain types at boundaries (types)               | B+    |
| Process narratives (process)                     | A     |

### Top 5 improvements

1. Name the undo-delete window once (`UNDO_DELETE_WINDOW_MS`) and share it across the expiry filter, the toast `duration`, and the cleanup hook.
2. Route all step/block actions through `extractStructuredWorkout` to retire the 18 scattered `as Workout` casts.
3. Brand `create-step-action`'s `newStep.id` as `ItemId` to match the other three create/mutate actions.
4. Reconcile the `auto-match` doc comment ("±20%") with the actual `0.6` threshold (≈±40%), or introduce a named variance constant.
5. Lift the raw `db.table(...)` joins in `use-activity-match-state` / `use-matched-sessions-hydrate` behind a read-model port so hooks express intent, not Dexie query shape.

### Verdict

This is high-quality domain code. The hardest business rules — composite id-shape, session-match dedup, undo-history cap, batch retry/cadence, auto-match scoring, zone/TSS math, sync debounce — are overwhelmingly expressed as named constants and documented invariants, with pure application use cases cleanly separated from port-injected IO and a process-narrative style (typed result unions, explicit state machines) that reads as the business flow. The residual debt is small and mechanical: a few editor-runtime constants (the 5s undo window) and a domain cast (`as Workout`) that escaped the existing centralizing helpers, mild primitive-obsession on the freshly-minted `ItemId`, and read-side hooks that still speak Dexie directly where the write side speaks ports. None of these are correctness risks, and one is merely a stale comment — but each is a place where the _language_ of the code understates a rule that the codebase clearly knows. Tightening those would move state/types from B+ to A− and make the layer's intent legible end-to-end.

Key files: `packages/workout-spa-editor/src/store/actions/clear-expired-deletes-action.ts`, `packages/workout-spa-editor/src/store/actions/_helpers/extract-workout.ts`, `packages/workout-spa-editor/src/store/actions/create-step-action.ts`, `packages/workout-spa-editor/src/application/auto-match-sessions.ts`, `packages/workout-spa-editor/src/application/auto-match-candidate.ts`, `packages/workout-spa-editor/src/hooks/use-activity-match-state.ts`, `packages/workout-spa-editor/src/hooks/use-matched-sessions-hydrate.ts`.
