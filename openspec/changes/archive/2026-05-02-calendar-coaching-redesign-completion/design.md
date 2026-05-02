## Context

The archived `2026-05-01-calendar-coaching-redesign` change was chunked across PRs 1–4. PRs 1–3 landed (#409, #410, #411, #415, #416), but the §8.5/§8.6, §9, §10.3, §11, and §12.4a tasks — originally split between PR 3's tail and the entirety of PR 4 — were broken out into follow-up issues #431–#435 and never re-attempted. The user-facing consequence is that the auto-match heuristic and the match/unmatch use cases are running in production with no UI seam to the user, and the perf budget that was supposed to guard the redesigned `CalendarPage` was deferred (so any regression is invisible to CI).

A spec-drift problem compounds the above. The archive operation promoted the **modified** capabilities (`spa-calendar`, `spa-coaching-integration`) into `openspec/specs/` but did not promote the **new** capabilities (`spa-session-match`, `spa-user-preferences`) — even though their implementations have been live for weeks. This change creates both spec files from the union of the archived deltas and the new requirements added here, restoring spec/code parity.

The decisions below extend (and are numbered to follow) the archived design's D1–D13 series.

## Goals / Non-Goals

**Goals:**

- Land all 5 deferred follow-ups (#431–#435) under one OpenSpec change so the spec deltas, tests, and decisions live together rather than scattered across 5 mini-changes.
- Honor the ship order required by issue dependencies: cascade-test safety net first, UI cosmetics next, dialog actions, banner wiring with the new `dismissAutoMatchBanner` use case, perf budget last so it measures the final shape.
- Introduce `spa-session-match` as a new capability with the requirements actually exercised by issues #431–#435 (the `dismissAutoMatchBanner` use case, the per-pair dismissal model, the `AutoMatchDismissalRepository` port). Promotion of the rest of the archived `spa-session-match` content (matchSession, unmatchSession, autoMatchSessions, etc.) and of the entire archived `spa-user-preferences` capability is **out of scope** here and will be handled by a follow-up `/opsx-sync` operation tracked separately.
- Keep the change surgical: no new domain types, no new Dexie tables, no schema bump (every needed table was provisioned in v5 by the archived change).

**Non-Goals:**

- Re-litigate decisions D1–D13 from the archived design. Those are settled and continue to apply.
- Change the auto-match heuristic itself. Threshold (`score ≥ 0.6`), gating (`same date AND same sport`), and greedy assignment are unchanged — the work here only surfaces what the heuristic already produces.
- Add zone- or TSS-based compliance scoring (still a tracked follow-up to the archived change).
- Touch the auto-match call site outside the calendar (e.g., bulk operations, season views).
- Rework `EmptyDayDialog`, drag-and-drop, or any out-of-scope item already excluded by the archived design.

## Decisions

### D14 — One change, five PR chunks

**Decision:** ship the 5 follow-ups under a single OpenSpec change with 5 PRs ordered as `PR-A → PR-B → PR-C → PR-D → PR-E` per the issue map, rather than five micro-changes.

**Rationale:**

- The 5 issues share an origin (calendar-coaching-redesign), share components (`CalendarPage`, `CoachingActivityDialog`, `CoachingSyncButton`), and require coordinated spec deltas. One change keeps the spec history coherent.
- The new use case `dismissAutoMatchBanner` (introduced in PR-D) is a domain decision that benefits from being captured in one design.md, not three.
- The perf budget (PR-E) gates the entire bundle — its spec depends on PR-C and PR-D having shipped so it measures the final `CalendarPage`. A single change with explicit PR ordering encodes this dependency in the tasks file.
- `/opsx-ship` can babysit the 5 PRs sequentially against this one change.

**Trade-off:** the change has a wider review surface than 5 small ones. Mitigation: PRs are independently reviewable and merge in the documented order; tasks.md groups by PR so reviewers can scope to one chunk at a time.

### D15 — `dismissAutoMatchBanner` writes to the existing `autoMatchDismissals` table; key is the suggestion pair, not the suggestion id

**Decision:** persist a per-suggestion dismissal as a row in the existing Dexie `autoMatchDismissals` table (provisioned in v5 by the archived change with composite PK `[profileId+weekStart]`). The PR-D implementation extends the row shape so a single weekStart row can carry multiple dismissed pairs:

```ts
{ profileId, weekStart, dismissedPairs: Array<{ activityId, workoutId, dismissedAt }> }
```

`dismissAutoMatchBanner({ profileId, weekStart, activityId, workoutId, dismissedAt })` reads the row, appends the pair (deduped by `{activityId, workoutId}`), and writes back. `isAutoMatchBannerDismissed` queries by `(profileId, weekStart, activityId, workoutId)` and returns `true` if a matching pair exists.

**Rationale:**

- Composite PK `[profileId+weekStart]` was already chosen by the archived design for cascade hygiene (one row per profile-week, not one per dismissal — bounds the cascade scan). Extending the row in place preserves that bound.
- Keying by the **pair** rather than by an internally-generated suggestion id means the dismissal survives `autoMatchSessions` re-running (which produces fresh suggestion objects each call but identifies the same activity/workout pair).
- Scope semantics (not a TTL): dismissals are scoped to `weekStart`, not to wall-clock time. Once the user navigates to a different week, the dismissal carries no weight there. Within the same week, dismissals are permanent for that device (no expiry — idempotent re-suggestion is forbidden; the spec scenario "Dismissing a suggestion does not re-surface it on the same device for that pair" pins this). This is a deliberate departure from the archive's prior `DISMISSAL_TTL_MS = 24h` model — the spec accordingly removes that requirement (see `spa-session-match/spec.md` `## REMOVED Requirements`).
- Bounded growth: `dismissedPairs` is bounded by the number of distinct activity/workout pairs in the visible week; cascade hooks remove dismissed pairs whose underlying activity or workout is deleted, so the array does not accumulate stale references. As a defensive cap, `dismissAutoMatchBanner` SHALL refuse to grow `dismissedPairs` past 256 entries per `(profileId, weekStart)` row (any later dismiss is a no-op + warn). 256 is two orders of magnitude beyond any plausible weekly coaching density and is documented as a guard against runaway growth from any future bug.
- No new Dexie table, no schema bump. The cascade hooks established in v5 already delete the row on profile delete.

**Alternatives considered:**

- _New `dismissed_suggestions` table keyed by `[profileId+activityId+workoutId]`_: rejected — duplicates the cascade plumbing already wired in v5 and creates an unbounded growth surface (one row per ever-dismissed pair).
- _In-memory store on `useAutoMatchSuggestions`_: rejected — dismissals must survive page reload; that's the whole point.

### D16 — Performance budget spec: synthetic 30-card week, CPU throttle 4×, FCP measured against `[data-route-heading]`

**Decision:** the Playwright performance spec (PR-E) implements design D11 of the archived change with this concrete shape:

- **Seed data**: in `test.beforeEach`, `db.bulkPut` 30 rows distributed as 10 `MATCHED` (one `coaching_activities` row + one `workouts` row + one `session_matches` row per matched session), 10 solo plans (`coaching_activities` only), 10 solo actuals (`workouts` only). All 30 rows fall within the same week so the calendar renders the full set without pagination.
- **CDP throttling**: `await client.send('Emulation.setCPUThrottlingRate', { rate: 4 })` before the navigation, calibrated against the Moto G Power 2022 reference per archived D11.
- **FCP measurement**: assert `performance.getEntriesByName('first-contentful-paint')[0].startTime <= 1500` (CI-calibrated envelope on ubuntu-latest with throttle 4×) after waiting for `[data-testid="calendar-page"]` to be visible. Archived design D11 named 200 ms as the aspirational target for a Moto G Power 2022 reference device; CI hardware is a different baseline so the envelope here is regression-detection-oriented (~25% headroom over the worst observed at PR-E push). The slice budget on `useMatchedSessions` is the architecturally meaningful guardrail and is asserted strictly at 30 ms.
- **Hook budget**: `useMatchedSessions` wraps its body in `performance.mark('useMatchedSessions:start')` / `performance.mark('useMatchedSessions:end')` and calls `performance.measure('useMatchedSessions', start, end)`; the spec asserts the worst measured duration ≤ 30 ms.
- **CI placement**: spec lives in `packages/workout-spa-editor/e2e/calendar-performance.spec.ts` and runs in the existing `e2e-frontend` matrix (one of the 4 shards); no new job.

**Rationale:**

- A budget that requires its own job invites being silently skipped. Co-locating it in the existing matrix means every PR runs it.
- The `performance.mark`/`performance.measure` ceremony lives behind a `if (import.meta.env.DEV || import.meta.env.MODE === 'test')` guard so production bundles pay zero overhead.
- Splitting "FCP envelope" from "useMatchedSessions slice" lets the architecturally meaningful budget (the join inside the hook) stay strict while the broader page-render measurement absorbs CI-runner variance. The reference-device aspirational target lives in design D11; this change documents the CI baseline separately.

**Trade-off:** the FCP envelope on CI is far looser than the reference-device target. Mitigation: the slice budget catches matched-session regressions directly; FCP catches gross regressions (e.g., bundle bloat, render churn) that even a generous envelope would surface. The reference-device measurement is left to a future on-device performance harness — out of scope for this change.

### D17 — `formatRelativeTime` rounding rules and accessible string

**Decision:** the new helper `formatRelativeTime(date: Date | undefined, now: Date): string` in `packages/workout-spa-editor/src/utils/format-relative-time.ts` returns:

- `"never synced"` when `date` is `undefined`.
- `"just now"` when `now - date < 60_000` (under a minute).
- `"<n>m ago"` when `now - date < 3_600_000` and `n = floor(diff / 60_000) ≥ 1`.
- `"<n>h ago"` when `now - date < 86_400_000` and `n = floor(diff / 3_600_000) ≥ 1`.
- `"yesterday"` when `now` and `date` fall on different calendar days AND `now - date < 172_800_000` (under 48h).
- `"<n>d ago"` when `now - date < 604_800_000` and `n = floor(diff / 86_400_000) ≥ 2`.
- An ISO date `YYYY-MM-DD` for anything older — coaching sources don't surface stale data past a week, but we keep a deterministic fallback rather than throwing.

Branches SHALL be evaluated **top-down**; the first matching branch wins. A reader can compute the output for any input by walking the list once.

`now` is injected (not `Date.now()` inline) so tests are deterministic without `vi.useFakeTimers`.

**Rationale:**

- The button tooltip is the only consumer; it's a screen-readable string, so the strings are exact and tested per branch.
- Hard-coding rounding rules in the helper rather than reaching for `Intl.RelativeTimeFormat` keeps the bundle smaller and the strings predictable across locales (we accept the English-only constraint per the project's language rule).

### D18 — `deleteProfile` cascade test enumerates `db.tables`, not a hard-coded list

**Decision:** the new test at `packages/workout-spa-editor/src/application/delete-profile.test.ts` (or extension to existing) iterates `db.tables` (Dexie's runtime metadata), filters for tables that hold per-profile rows (every table whose schema indexes `profileId` either as PK or as a top-level index), seeds one row per table for two profiles A and B, calls `deleteProfile(A)`, and asserts that `(table) => table.where('profileId').equals(A).count()` returns `0` and `equals(B).count()` returns `1` for **every** filtered table. A second test patches one table's `delete` (via Dexie hooks or `vi.spyOn` on the repository) to throw; asserts that after `deleteProfile` rejects, every filtered table still holds two rows (full rollback).

**Rationale:**

- A hard-coded cascade list rots silently — adding a new per-profile table without updating `deleteProfile` produces a ghost-data leak that no test catches. Iterating `db.tables` makes the cascade self-describing: any new per-profile table forces the test author to either include it in `deleteProfile` or document why it's exempt.
- The transactional rollback assertion is the only place that exercises the "abort mid-fan-out" path — without it, `deleteProfile`'s `db.transaction('rw', [...], ...)` wrapper is decorative.

**Trade-off:** the test depends on the runtime structure of Dexie tables, so reorganizing the schema (e.g., compounding indexes) could require touching the test selector predicate. Acceptable: the predicate is a small, focused function; documentation in the test header records the contract ("a table is per-profile if its first index is `profileId` or its primary key is `[profileId+...]`").

### D19 — `AutoMatchBanner` mounting respects the dismissal lookup at render time, not at suggestion-build time

**Decision:** `useAutoMatchSuggestions(profileId, weekStart)` returns the **raw** suggestions from `autoMatchSessions(...)` without filtering. `CalendarPage` filters at render time by calling `isAutoMatchBannerDismissed(profileId, weekStart, activityId, workoutId)` per suggestion (the lookup is a `useLiveQuery` keyed on the row, so dismissals reactively hide the row across tabs and reloads). The banner renders only if the filtered list is non-empty.

**Rationale:**

- Filtering at suggestion-build time would require `autoMatchSessions` to take a dismissal-lookup dependency, conflating heuristic logic with UX state. Keeping `autoMatchSessions` pure preserves its testability (no Dexie dep) and matches the archived D2 separation ("auto-match is heuristic; UX state is elsewhere").
- The `useLiveQuery` ensures dismissing a suggestion in one tab updates other open tabs deterministically.

## Risks / Trade-offs

- [**Risk** — perf spec flakes on shared CI runners] → Mitigation: Playwright's built-in retry covers transient runner variance; persistent failures across retries are real regressions. If observed flake exceeds 1/100 runs after one week on `main`, relax the budget by ≤20 ms in a follow-up rather than disabling the spec. Document the runner baseline (Linux ubuntu-latest, 2 vCPU, 7 GB RAM) in the spec body so future reviewers can compare apples-to-apples.
- [**Risk** — `db.tables`-based cascade test breaks every time a non-per-profile table is added] → Accepted by design: any schema addition forces a deliberate "is this per-profile?" decision. The test predicate is documented; the breakage is loud and educational, not silent and dangerous.
- [**Risk** — `dismissAutoMatchBanner` row growth on busy users] → Bounded by two layers: (a) **expected** density is ≤ 7 plans × ≤ 3 workouts per week, so a typical row holds at most ~21 entries; (b) **enforced** cap is 256 entries per `(profileId, weekStart)` row (per D15, with re-dismiss-at-cap as in-place update; 257th distinct dismiss is a no-op). 256 is two orders of magnitude beyond the expected bound and exists as a runaway-growth guard for any future regression that might cause unbounded enumeration. Either way, well under any IndexedDB row-size concern.
- [**Risk** — CoachingActivityDialog match/split actions race with cascade hooks if the user double-clicks "Split" while a sync is in flight] → Mitigation: the dialog disables the Split button while `unmatchSession` is in flight; the use case is idempotent (deleting an already-deleted match is a no-op per archived D1's cascade rules).
- [**Risk** — match-to picker performance on busy days] → Mitigation: the picker filters at the Dexie layer (`workouts.where('[profileId+date]').equals([profileId, day]).toArray()`) and renders a flat list — typically ≤ 5 items per day. No virtualization needed.
- [**Trade-off** — only the dismiss-banner slice of `spa-session-match` is specced here; the rest stays archived-but-unpromoted until a follow-up `/opsx-sync`] → Accepted: re-authoring 485 lines of archive verbatim is out of scope for a 5-issue completion change. The follow-up sync MUST reconcile the two delta sources by (a) lifting the archive's still-valid requirements (matchSession, unmatchSession, autoMatchSessions, useMatchedSessions, compliance score, sport-family canonical mapping, SessionMatchRepository port) into the now-existing `openspec/specs/spa-session-match/spec.md` and (b) confirming this change's `## REMOVED Requirements` block (the prior 24h TTL) is honored — i.e., the `DISMISSAL_TTL_MS` requirement does NOT come back as part of the lift.
- [**Trade-off** — the perf spec adds `performance.mark` calls inside `useMatchedSessions`] → Accepted: the marks live behind a dev/test guard and add zero production overhead. They also document the budget in code, which prevents drift between spec and implementation.

## Open Questions

- Should `formatRelativeTime` localize for non-English users? Resolved: no — per the project's English-only language rule, and the helper is internal to the SPA which has no i18n infrastructure today. Tracked as a future capability if i18n is ever introduced.
