> Completed: 2026-10-14

# Proposal: Manual steps keep their own row

## Why

Since 2026-10-14-t2g-weight-is-current-weight, a manual save reuses only the
day's manual row and never re-stamps another source's row. Steps was left as
the exception: a manual steps entry merged into the day's daily-wellness row,
whatever its source, and re-stamped it `manual`. An imported Garmin, WHOOP or
Tanita daily row ended up labelled manual, so its provenance was lost.

The exception existed because every daily-wellness reader picked one row of
the day (`rows[0]`): with a separate manual row that pick would be arbitrary,
and the energy balance could lose the imported calories.

## What Changes

- A manual steps entry writes the day's own `manual` daily row (updated in
  place on a re-save) and never touches another source's row. The manual row
  carries zero-filled calories and intensity, which are not values the athlete
  entered.
- Every daily-wellness reader (energy balance, the Activity page, the steps
  trends, the calendar steps badge, the chat `query_health` tool) reads one
  reading per day through `loadDailyWellness`, which combines the day's rows
  per field:
  - rows are ranked by the data type's effective `sourceOrder` when its source
    policy is "priority" (the same `sourceOrder ∩ enabled import policies`
    that `resolveEffectiveSource` consults, now shared as
    `effectiveSourceOrder`), then manual, then source id, then row id. Never
    by storage order, so the reading is the same whatever order rows were
    written in;
  - per field, the first ranked row that provides it wins. A manual row
    provides only `steps`, so the manual steps win by default and the
    imported calories survive.
- The Data Hub's per-source views still list each source's own row.

## Impact

- No Dexie schema change.
- `buildStepsPayload` no longer takes a prior row.
- A day whose only daily row is manual still reads its zero-filled calories
  as measured, as before this change.
