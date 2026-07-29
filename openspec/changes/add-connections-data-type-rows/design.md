# Design — Connections data-type routing rows

## D1. The pill reports the mode, not a preferred brand

The reference design's organising line is "one source of truth per type · others
stay as backup". `DEFAULT_DATA_TYPE_SOURCE_MODE` is `union`, and union keeps
every source's record for a day with nothing ranking them
(`resolve-effective-source.use-case.ts`); `pick-effective-health-record.ts` takes
`records.at(-1)` when one value is needed, and its own comment says union "has no
ranked winner". `use-source-policy-editor.ts` even erases `sourceOrder` when the
user selects union.

So the pill is derived from the mode:

| sources | mode       | pill                      |
| ------- | ---------- | ------------------------- |
| 0       | —          | "No source"               |
| 1       | —          | that source's name        |
| ≥2      | `priority` | head of `orderSources(…)` |
| ≥2      | `union`    | "N sources"               |

The `priority` head is the same element `resolveEffectiveSource` consults first,
so the pill and the resolver cannot disagree. `manual` is appended last to the
available list, which keeps a saved order (the Data Hub editor only ever writes
bridge ids into it) deciding the head.

**Alternative rejected**: making the row's "Change" control write
`mode: "priority"` on first use so the pill becomes true going forward. That
silently changes read semantics for the type — a Wave 2b decision to state
explicitly, not one to slip in under a read-only surface.

### D1a. `priority` with nothing ranked is unranked, not primary

The head is the first entry of the saved order that is still an available
source — the same element `resolveEffectiveSource` picks. When the saved order
pins none of them there is no head, and the row reports a count.

This is not defensive coding; both doors are open today. The chat
`set_data_route` tool's refinement counts the RAW `sourceOrder`, so `["strava"]`
(a real registry entry with no bridge id) passes the length check and then
resolves to nothing — review believed the ABSENT-order door was also open, but
`setDataRouteSchema.superRefine` does close that one. Independently, ranking
Garmin and then switching Garmin's import off and WHOOP's on leaves a saved
order pinning nothing available, through the Data Hub alone. In both states the
pre-fix code named `sources[0]` — policy-table insertion order — which is the
same overclaim union avoids, arriving through a different door.

### D1b. The writer refuses what it cannot honour

`applySourcePolicy` is where that state is minted, so it is fixed here rather
than deferred: a ranked mode whose order resolves to nothing is refused and
reported, following `applyRouteToggle`'s existing shape (return an `error`
object, write nothing) rather than throwing. A partially-resolvable order is
still stored — one usable source ranks something. Deferring this to Wave 2b
would have meant its "Change" control inheriting a corrupt state class.

## D2. `buildSourcePolicyRows` is not widened

`source-policy-rows.ts` skips any type with fewer than two enabled import
sources. That skip is correct for what it does — it gates a reorder control, and
a single-source type has nothing to reorder — and its test pins it. Reusing it
here would drop eleven of the thirteen rows on a typical profile. This change
adds `buildDataTypeRoutingRows`, which covers all thirteen, and reuses only the
pure `orderSources` helper so both agree on what "first" means.

## D3. Freshness bypasses the Data Hub matrix

`build-data-hub-matrix.ts` computes a per-cell `lastSyncedAt` (and only when the
cell is active). These rows are per-TYPE and each already resolves at most one
source, so they read `useBridgeSyncStates(...).get(sourceId)` directly: one
`useLiveQuery`, no change to shared code, no test churn, and nothing stranded
when Wave 4 deletes the matrix UI.

The constraint this creates is a copy constraint. `coachingSyncState` is keyed by
`[source+profileId]` and holds no data type, so "Sleep arrived 2 minutes ago" is
not a sentence the state can support. The row names the source
("Garmin last sent data 2 minutes ago") and the section header says once that
these times are per source. A row with no single owning source shows no time at
all rather than picking one of several arbitrarily, and manual entry — which
never writes a sync row — shows none either.

## D4. "Also sent to" is absent, not empty, where no export can exist

`MANAGED_DATA_REGISTRY` gives an export capability to `workout` and
`body-composition` only. `useDataFlows` therefore returns `export: []` for the
other eleven **by construction**, not because the user switched something off.
Rendering "Nowhere" there would describe the absence of a route that cannot be
created; the affordance is omitted instead. `workout` with no enabled export
route does say "Nowhere", because there the sentence is true.

## D5. The grouping is new code, so it gets an invariant

Training / Recovery / Body exists nowhere in `@kaiord/core`; `managedDataTypes`
is flat. A fourteenth type added there would belong to no group and disappear
from the page with nothing failing — and three types (`strain`, `vitals`,
`heart-rate-series`) were already appended to that list in exactly one PR.
`data-type-groups.test.ts` asserts the partition in both directions: every
managed type is grouped exactly once, and no group holds a type the domain no
longer manages. The same drift one row lower is covered by extending
`connections-data-types.test.ts` to the new hint catalog.
