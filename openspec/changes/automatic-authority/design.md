## Context

Today's mechanism, mapped before changing it:

- **Who reports what.** From the bridges' announced tokens narrowed by
  `bridge-supported-routes.ts`: weight comes from Tanita, TrainingPeaks and
  Train2Go (its zones sync) and from the athlete; body composition from Tanita
  and the athlete; sleep, HRV, stress, strain, vitals and the heart-rate
  series from WHOOP (and the athlete, where a manual path exists); Activities
  from Garmin, WHOOP and file drops; planned sessions from Train2Go and the
  calendar; training zones from Train2Go and the athlete's own edits.
- **Where the Authority is read.** `resolveEffectiveSource` (the Day's
  readiness, HRV and sleep; the assistant's `get_data_routes`) and
  `loadDailyWellness` (one reading per day for energy and the Day) read the
  per-kind `dataTypeSourcePolicy` row: `priority` reads a ranked order with
  fallback, `union` keeps every record. With no row the default was `union`,
  and a consumer needing one value took the record written last: the order
  records happened to be stored in decided.
- **Where the athlete is asked.** The Connections page's "Where each data
  type comes from": per kind, a "Change" panel with the import switches, a
  ranking of sources and "Keep every source", whose copy explains read
  semantics. The assistant's `set_data_route` (`set_source_policy`). The
  Train2Go zones conflict dialog ("Accept Train2Go" / "Keep current"), opened
  on connect and on every sync, and on mount for an auto-import route, when
  Train2Go reports a number different from one the athlete set. The Athlete
  page's switch "Let a connected source update these numbers", whose copy
  said On overwrites typed numbers (it never did: it only decides whether the
  import runs by itself).
- **When nothing is chosen.** `union`: every record kept, the last written
  one shown; on the zones dialog, the default "Keep current" for every row.

## Decisions

### D1. One rule: your own entry, then a fixed order of Platforms per kind

`application/data-source-policy/automatic-authority.ts` holds the rule. What
the athlete entered or imported themselves (`manual`, `fit-import`) decides
its day; then the Platforms in a fixed order per kind:

| Kind                                                                  | Order                                      | Reason                                                                   |
| --------------------------------------------------------------------- | ------------------------------------------ | ------------------------------------------------------------------------ |
| weight, body composition                                              | Tanita, TrainingPeaks, Train2Go            | a scale measures them; the other two relay a number someone typed in     |
| sleep, HRV, daily wellness, stress, strain, vitals, heart-rate series | WHOOP, Garmin                              | measured by what is worn overnight; WHOOP is worn day and night          |
| training zones                                                        | Train2Go (the athlete's own numbers first) | the coach's Platform; a number the athlete set is never overwritten (D5) |
| Activities, planned sessions, Workouts                                | none: every one kept and shown             | separate events, not one value; hiding one would lose it                 |

The athlete's current weight (zones, energy) stays the most recent weigh-in
from any source (`current-weight.ts`), because a later measurement is the
truth about today; the order above decides the reading of a day two sources
weighed.

It never loses or silently overwrites: the rule only picks which stored
record is read. A Platform whose import is off drops to the end of the order,
and a source the order does not name is read last, so a day only it reported
still shows its value (under a stored `priority` choice such rows are dropped,
as before).

Rejected: **the Platform connected first for the kind.** Predictable and it
never changes a value already shown, but there is no record of when a route
was opened (`IntegrationPolicy` has only `updatedAt`, which every toggle
moves), so it needs a new stored order that must sync, travel in a backup and
be migrated for existing athletes, and the answer differs between two
devices linked in a different order. **The most recent measurement.** Right
for the current weight, but per-day kinds (one night's sleep from two
Platforms) have no comparable measurement time across schemas, and "last
written" is sync order, which is what the athlete could not predict.

A fixed order needs no state, reads the same on every device and from a
backup, and can be written in one sentence per kind. Its one surprise, a
better Platform connected later taking over a kind, does not change a stored
record, and Connections names the Platform that decides with "chosen by
Kaiord" (D4).

### D2. On disconnect the next Platform decides

Disconnect switches the bridge's import routes off with the Disconnect marker
(unchanged). The rule moves an off Platform to the end of the order, so the
next one decides; the off Platform's records stay stored and are still read on
a day nobody else reported. Reconnecting restores the routes
(`restoreDisconnectedRoutes`) and the Platform decides again.

### D3. The matrix: an advanced Capability whose choices stop applying when off

```ts
{ id: "authority-matrix", grade: "advanced",
  owns: { settings: ["authority"], tools: ["set_data_route"],
          inScreen: ["connections-authority-link"], … },
  adoptsExistingData: "dataTypeSourcePolicy" }
// MODULES (scripts/capability-surfaces.vocab.mjs):
//   ["components/organisms/AuthorityMatrix/",
//    "hooks/connections/use-authority-choice-editor.ts"]
```

The section "Which Platform decides" (Settings) lists each kind with more
than one source it can be read from, says what decides it now, and offers
"Automatic" first and each source. "Automatic" writes a row rather than
deleting it, so the hand-back syncs like any other choice. The row is marked
`automatic: true` and carries the rule itself, so a device on an older build
(whose resolver reads any row that is not `union` as a ranking) shows the
same Authority: `priority` with the athlete's own entry and the kind's
Platforms in the rule's order, or `union` for a kind kept side by side
(`automaticChoiceRow`). Rejected: a row with mode `automatic` and an empty
order, which an older build read as a ranking of nothing, so its Day showed
no weight. Such rows, written before the marker, still read as automatic.
Connections links to it only inside `<CapabilityGate surface>`.

**Off, the stored choices stop applying** (`readAuthorityChoice`, which
asks the Capabilities' read API, and `authorityInForce`, the one function
every reader uses to decide what decides a kind). Rejected:
keep applying them. An athlete who turns an advanced part of the App off
expects the App to stop doing what that part did; choices that keep deciding
while nothing on screen shows them, or lets them be changed, are a hidden
rule, and Connections would have to name a Platform the athlete can no longer
see why. The choices are kept (turning a Capability off never loses data), so
turning it on again restores them.

**Existing athletes**: any row in `dataTypeSourcePolicy` means the athlete
used the matrix (or asked the assistant), so with no decision recorded the
Capability reads as on and their choices keep winning (the #1659
`adoptsExistingData` reading, counted per athlete by the table's `profileId`
index). An explicit off wins.

The assistant: `set_data_route` is owned by the Capability, so it leaves the
model's Tools and "what can I do" while off, with no change to its schema or
description. `get_data_routes` reports `mode: "automatic"` and the rule's
order where the rule decides, so it never says `union` for a kind the App
reads one Authority for.

### D4. Connections asks nothing

The ranking control and "Keep every source" leave the Connections rows; the
"Change" panel keeps only the switches that let a source send a kind (they
decide whether a source is read at all, not which decides). A row whose kind
has two or more sources names the Platform the rule picks and notes "chosen
by Kaiord; a value you enter yourself wins on its day". Rows read only the
choices in force, so with the matrix off they name the automatic Authority.

### D5. The zones conflict dialog becomes one notice with one action

`syncZones` already writes fills and returns differing numbers unwritten.
The dialog that asked about each is removed; the athlete's numbers stay (the
dialog's own default). Once per set of differing numbers (a per-device memo,
`zones-offer-memo.ts`), an info toast says "Train2Go has different numbers
from yours. Kaiord kept yours." with "Use Train2Go's", which commits every
differing field as accepted (so FTP and its power bands stay together). This
is ADR 0003's "decide and offer undo": no confirmation dialog, and the
Athlete page's per-threshold "Use / Keep" row stays as the pointer to a
difference. The auto-import switch stays, worded for what it does: it brings
new numbers in by itself and never overwrites the athlete's.

## Risks

- The memo is per device: a second device shows the notice once more.
- A union row stored by an older "Keep every source" applies while the
  matrix is on; the matrix shows no button pressed for it and says every
  source is kept.
