## Why

An athlete with two Platforms that report the same kind of data is asked
which one decides: a matrix of 13 kinds with ranking and "Keep every source"
on Connections, a conflict dialog on every Train2Go sync with a different
number, and the assistant's `set_data_route`. They cannot answer that
question, and with no answer the App read whichever record was written last
(#1670, stories 27 and 28; ADR 0003 "decide and offer undo"). The matrix is
the Authority Capability the mechanism of #1659 was built to hold.

## What Changes

- **Automatic Authority**: with no choice in force, one deterministic rule
  per kind picks the Authority: the athlete's own entry decides its day, then
  a fixed order of Platforms per kind (a scale for weight and body
  composition, what is worn overnight for sleep, HRV and the rest, Train2Go
  for zones); Activities, planned sessions and Workouts keep every source. It
  only chooses which stored record is read; nothing is deleted or hidden.
- **On disconnect** the next Platform decides; the disconnected one's records
  stay and are still read on a day nobody else reported.
- **The matrix is an advanced Capability** (`authority-matrix`, off by
  default): a Settings section "Which Platform decides" with "Automatic" and
  each source per kind, and the `set_authority` Tool. On, its choices
  override the rule; off, it leaves no trace and its choices are kept without
  applying. An athlete with a stored choice reads it as on.
- **Nothing asks**: Connections keeps the per-kind switches and names the
  Platform that decides; the ranking control and "Keep every source" leave it.
  The zones conflict dialog is removed: the athlete's own numbers stay, and
  one notice offers "Use Train2Go's". The auto-import switch says what it
  does: it never overwrites the athlete's numbers.
- English and Spanish.

## Capabilities

### New Capabilities

- `spa-authority`: the rule, disconnect, the matrix Capability, nothing asks.

### Modified Capabilities

- `spa-connections-page`: rows name the automatic Authority; the
  source-of-truth control and its two companion requirements are removed.
- `train2go-zones-sync`: no conflict dialog; one notice and one action.

## Impact

- `@kaiord/workout-spa-editor` (private): the resolver and the daily-wellness
  read, the Connections rows, a new Settings section, the catalogue entry,
  the zones sync orchestrator, the `connections`, `settings`, `coaching`,
  `athlete` and `zones` dictionaries, unit and e2e specs.
- The assistant's `get_data_routes` reports `automatic` where the rule
  decides; choosing the Authority moves from `set_data_route` to a new Tool,
  `set_authority`, offered only while the matrix is on; `set_data_route`
  keeps switching a source's import on or off, offered always.
