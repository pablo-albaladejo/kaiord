## Why

Two capability specs in production diverged from `openspec/specs/`:

- **`spa-session-match`** has been running since the archived `2026-05-01-calendar-coaching-redesign` change (PRs #410, #415) but only the per-pair-dismissal slice (`dismissAutoMatchBanner`, `AutoMatchDismissalRepository`, "Per-pair dismissals do not expire on a TTL", cascade hooks) was promoted into `openspec/specs/spa-session-match/spec.md` by the follow-up `2026-05-02-calendar-coaching-redesign-completion` change. The full archived surface (`SessionMatch` aggregate, `matchSession`/`unmatchSession`, `autoMatchSessions` heuristic, `useAutoMatchSuggestions` hook, `SessionMatchRepository` port, sport family canonical mapping, compliance score derivation/limitations, the auto-match suggestion banner) was deferred to follow-up issue #460 because re-authoring ~485 lines of spec was out of scope for the 5-issue completion change.
- **`spa-user-preferences`** is entirely missing from `openspec/specs/`. Its full archived spec (~133 lines) lives only in `2026-05-01-calendar-coaching-redesign/specs/spa-user-preferences/spec.md` even though `getUserPreferences`, `setCalendarDensity`, and `useUserPreferences` have been in production for weeks.

This change is a mechanical `/opsx-sync` lift: bring the live `openspec/specs/` tree back to parity with what the codebase already does. No behavior changes; no code touched.

## What Changes

- **`openspec/specs/spa-session-match/spec.md`** — extended from the existing 4 requirements to a complete 14-requirement canonical spec covering the full SessionMatch surface. Reconciled against the per-pair dismissal model: the lifted "Auto-match suggestion banner" requirement drops the prior "Dismiss-all" control and the 24h-week-banner suppression (both are inconsistent with the per-pair-no-TTL model). The lifted `useAutoMatchSuggestions` hook now reads `dismissedPairs` directly via `useLiveQuery` and filters per-pair, replacing the original `isAutoMatchBannerDismissed` 24h check. The archived `Auto-match dismissal TTL is a named constant` requirement and `Rejected suggestions are session-scoped (not persisted)` requirement are NOT lifted (per design D15 of the completion change).
- **`openspec/specs/spa-user-preferences/spec.md`** — created from scratch by lifting the archived spec verbatim, with one minimal reconciliation: the cascade-hook requirement now references the `spa-session-match` cascade-table inventory (which already lists `userPreferences` under `profiles`) rather than re-stating its own cascade contract. Table names use camelCase per the project's adapter-schema convention; the snake_case names in the original archived spec (`user_preferences`) refer to the same physical table.

## Capabilities

### Modified Capabilities

- `spa-session-match`: extended with 9 lifted requirements + reconciled banner / view-model hook to match the per-pair model. The 4 existing requirements (`dismissAutoMatchBanner` use case, `AutoMatchDismissalRepository` port, `Per-pair dismissals do not expire on a TTL`, `Cascade hooks on coaching-activity and workout deletion`) are preserved verbatim with one enhancement: the cascade-table inventory grows to include `autoMatchDismissals` under both `coachingActivities` and `workouts` (necessary for the per-pair-dismissal-purge cascade documented in the existing requirement; previously implicit, now explicit in the inventory table).

### New Capabilities

- `spa-user-preferences`: lifted verbatim from the archive with one minimal cascade reconciliation. 5 requirements: `UserPreferences` aggregate, `UserPreferencesRepository` port, `getUserPreferences` use case with default density derivation, `setCalendarDensity` use case, reactive preference reads via `useLiveQuery`.

## Impact

- **Affected packages**: none of `packages/**` are touched. Pure docs/spec change.
- **Affected layers (hexagonal)**: none — this is `/opsx-sync` lift.
- **Public API**: no changes.
- **Persistence migration**: none.
- **Dependencies**: no new runtime or dev dependencies.
- **Quality gates**: `pnpm lint:specs` and `npx openspec validate --specs --strict` pass on the merged state.
- **Risk surface**: the only risk is spec/code divergence — if the lift accidentally describes behavior the code does NOT actually do. Mitigation: requirements are lifted verbatim from the archive (which was authored alongside the code that shipped) with explicit reconciliation notes called out where the per-pair model overrides the archive's older model. No fresh requirements are introduced.
