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

### D1b. The writer refuses what it cannot honour — including partially

`applySourcePolicy` is where that state is minted, so it is fixed here rather
than deferred: a ranked order is stored only when EVERY name resolves,
following `applyRouteToggle`'s existing shape (return an `error` object, write
nothing) rather than throwing.

Refusing only TOTAL failure was the first attempt and was wrong. `.filter(id =>
id !== undefined)` keeps the survivors, so `["whoop-bridge", "tanita"]` — where
`whoop-bridge` is the storage key rather than the chat-facing id — drops WHOOP
and durably ranks Tanita first. The resolver honours it and the pill names it.
Partial failure is worse than total failure precisely because it looks like
success, so it is refused on the same terms, with the unresolvable names
reported back so the assistant can say which ones.

### D1c. Mode is consulted for one source too

`originOf` does not short-circuit on `length === 1`. A ranked order that
excludes the lone available source leaves the resolver's effective order empty,
so it returns nothing — and naming that source would attribute the type to
records that never surface. Reachable without any legacy data: chat
`set_source_policy stress priority ["garmin"]` resolves cleanly, so no writer
guard stops it, but Garmin announces only `write:workouts`, `read:activities`
and `write:body` — a Garmin stress import can never be enabled. Manual entry is
then the only source, and the pre-fix code named it while the user's typed
stress failed to reach Daily.

### D1d. "Ranked but unavailable" is its own state, not unranked

Folding it into `unranked` traded a false name for a false reassurance: the
unranked note says the sources are kept side by side with none ranked first,
which is the opposite of a row that is ranked and reading nothing.
`rankedUnavailable` therefore has its own label ("No usable source"), its own
note, and an amber ring — the one row on this read-only surface that presents
itself as a problem. No CTA: acting on it needs Wave 2b's picker.

### D1e. The explanatory copy is visible text, not a `title`

The first version put the "N sources" explanation in a native `title` on a
`<span>`, which no keyboard user can reach and which screen readers announce
inconsistently. Both explained states now render their note as visible muted
text in the slot the freshness line would occupy — which is free precisely
because neither state has a single owning source to date the row by.

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

## D4a. Test fixtures name the writer that can actually create them

Four fixtures originally described routes the capability gate forbids — Garmin
importing sleep or weight. Garmin announces `write:workouts`,
`read:activities`, `write:body` and nothing else, so the Data Hub renders those
cells `na` and its priority editor never lists the type. The assertions were
right and the tests passed; the provenance comments were fiction, which is this
programme's usual failure mode inverted, and it is what sent an earlier review
down the wrong door.

Fixtures now use capability-legal pairs — WHOOP for sleep (the only bridge
announcing `read:sleep`), WHOOP + Tanita for weight (both announce `read:body`,
both serve weight) — and each comment names the writer that creates the state:
the Data Hub cell toggle, its priority editor, chat `set_source_policy`, or
chat `enable_route`, which is the one writer with **no capability check at
all**.

## D5. The grouping is new code, so it gets an invariant

Training / Recovery / Body exists nowhere in `@kaiord/core`; `managedDataTypes`
is flat. A fourteenth type added there would belong to no group and disappear
from the page with nothing failing — and three types (`strain`, `vitals`,
`heart-rate-series`) were already appended to that list in exactly one PR.
`data-type-groups.test.ts` asserts the partition in both directions: every
managed type is grouped exactly once, and no group holds a type the domain no
longer manages. The same drift one row lower is covered by extending
`connections-data-types.test.ts` to the new hint catalog.
