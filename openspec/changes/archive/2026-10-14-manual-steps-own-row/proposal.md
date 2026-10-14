> Completed: 2026-10-14

# Proposal: Manual steps keep their own row

## Why

Since 2026-10-14-t2g-weight-is-current-weight, a manual save reuses only the
day's manual row and never re-stamps another source's row. Steps was left as
the exception: a manual steps entry merged into the day's daily-wellness row,
whatever its source, and re-stamped it `manual`. An imported daily row (a FIT
file import, `fit-import`, is the main producer) ended up labelled manual, so
its provenance was lost.

The exception existed because every daily-wellness reader picked one row of
the day (`rows[0]`): with a separate manual row that pick would be arbitrary,
and the energy balance could lose the imported calories.

## What Changes

- A manual steps entry writes the day's own `manual` daily row (updated in
  place on a re-save) and never touches another source's row. The manual row
  carries only the steps: the stored type is `storedDailyWellnessSchema`, the
  core daily-wellness schema with calories and intensity optional, so no
  zero-filled values the athlete never entered are stored.
- Every daily-wellness reader (energy balance, the Activity page, the steps
  trends, the calendar steps badge, the chat `query_health` tool) reads one
  reading per day through `loadDailyWellness`:
  - rows are ranked by the data type's effective `sourceOrder` under a
    "priority" policy (the same `sourceOrder ∩ enabled import policies` that
    `resolveEffectiveSource` consults, shared as `effectiveSourceOrder`), then
    manual, then source id, then row id. Never by storage order;
  - the head, the first row that is not a pure manual row, is read whole, as
    the resolver reads priority. Lower-ranked rows do not fill its gaps;
  - a pure manual row ranked above the head replaces only its `steps`. With no
    priority policy, manual ranks above every imported row, so the manual
    steps win and the imported calories survive;
  - under priority, rows of a bridge whose import is disabled are dropped. A
    source with no import policy (`fit-import`) stays as a fallback after the
    listed sources: unlike the resolver, which only considers listed sources,
    dropping it would leave every FIT-imported day blank;
  - the reading is not a stored row: it carries the head's id and provenance.
- A legacy manual row (an imported row an earlier save re-stamped `manual`,
  told apart by any non-zero calories, intensity or floors) is read as a full
  row, and a new steps save keeps its measured values, replacing only `steps`.
  This also covers an older device syncing such a row back.
- A day whose only daily row is a pure manual one has no measured calories:
  the energy balance predicts it from BMR instead of counting a measured
  0 kcal, and the Activity page shows "—" for its calories.
- `MANUAL_SOURCE_BRIDGE_ID` is exported once from `stamp-provenance`.
- The Data Hub's per-source views still list each source's own row.

## Impact

- No Dexie schema change; `@kaiord/core` is unchanged.
- `buildStepsPayload` no longer takes a prior row.
