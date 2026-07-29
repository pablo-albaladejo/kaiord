## Why

Wave 2a made every routing row answer "where does my sleep data come from",
including the answer nobody wants to hear: on a `union`-mode type there is no
source of truth, so the row can only say "2 sources", and on a row whose stored
ranking pins nothing available it can only say "nothing is being read". Both are
true and neither is actionable — the surface reports a decision the user cannot
reach from it. The Data Hub's priority editor can, but only for the types with
two or more enabled BRIDGE imports, and only on a different page.

## What Changes

- **An inline "Change" control on the rows that have a decision to make**: two
  or more sources, or a ranking already stored. Picking a source stores
  `mode: "priority"` with that source at the head; "Keep every source" stores
  `union` and clears the order.

- **The mode change is stated before it happens.** Using a control whose purpose
  is to choose a source of truth _is_ the user expressing a ranking, so recording
  one is the honest reading of the action — but it changes how the type is READ,
  from "keep every source's record" to "prefer this one", and a consequence that
  can only be discovered afterwards is a defect. On an unranked row the panel
  says, before either button is reachable, what the type does today, what picking
  will change, and that the change is reversible from the same place. A row
  already in `priority` is only reordering and warns about nothing.

- **"Keep every source" is listed first and always**, including on a row whose
  last remaining source would otherwise hide the control, so returning a type to
  the default is exactly as reachable as leaving it.

- **A shared definition of a type's sources.** `availableSources` and
  `rankedHead` move into `application/connections/data-type-sources.ts`, read by
  the Wave 2a pill and by this control, so what the row NAMES and what the
  control OFFERS cannot drift apart.

- **A capability filter on what may be offered.** Chat `enable_route` performs no
  capability check, so an enabled import route exists for pairings the Data Hub
  itself renders `na`. Those are not offerable as a source of truth: ranking one
  first would name a source that can never produce a record.

Deliberately NOT shipped:

- **No control on a single-source row under the default mode.** There is no
  second way to read the type, so the control could only flip the mode without
  changing what is read — a semantic change bought for nothing.
- **No free reordering of the fallback chain.** The control picks a head; the
  remaining sources keep their previous relative order behind it. Ranking
  positions 2..n is the Data Hub priority editor's job and no state needs it here.
- **No "connect first" choices for sources the type does not have.** Offering a
  bridge that is not yet an import route for this type is adding a route, which
  is the Data Hub cell toggle's job and carries the capability question this
  change explicitly does not reopen.

## Capabilities

### Modified Capabilities

- `spa-connections-page`: gains the source-of-truth control — which rows offer
  it, what it may offer, what it stores, the requirement that the mode change be
  stated before it is made, and the requirement that it be reversible. The
  capability is introduced by `add-connections-page` (Wave 1) and extended by
  `add-connections-data-type-rows` (Wave 2a); this delta is additive to both and
  contradicts no requirement in either.

## Impact

- **Package**: `@kaiord/workout-spa-editor` (private SPA) only. No domain, port
  or adapter-package change; no dependency added; no Dexie version bump; no new
  table and no new write path — the control writes `DataTypeSourcePolicy`
  through the same `persistence.dataTypeSourcePolicy.put` the chat tool uses.
- **Shared code touched**: `data-type-routing.ts` keeps its behaviour and now
  imports the source derivation it used to inline; `buildSourcePolicyRows` and
  its `< 2 sources` skip are untouched. `orderSources` is reused, for composing
  an order to STORE — never for reading a head out of one, which is the mismatch
  Wave 2a documented.
- **Behaviour change**: a user who uses the control changes the read semantics of
  that one data type, deliberately and after being told. Nothing changes for a
  user who does not.
- **i18n**: `connections.routing.change.*` in both locales, covered by
  `resource-parity.test.ts`.
- **e2e**: no test id and no URL changed; new ids (`routing-change-<type>`,
  `routing-picker-<type>`, `routing-choice-<type>-<source>`) are additive.
- **No** changeset (the SPA is private and excluded from the changeset-bot
  PUBLISHABLE set).
