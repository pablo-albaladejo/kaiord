## Why

The Connections section answers "which sources are linked". It does not answer
the question a user actually arrives with: _where does my sleep data come from_.
That answer exists in state today — enabled `IntegrationPolicy` import routes,
the per-type `DataTypeSourcePolicy` mode, the manual-entry path — but it is only
readable by cross-referencing a 13×9 matrix on a different page.

The reference design answers it with "one source of truth per type · others stay
as backup". **The product does not work that way.**
`DEFAULT_DATA_TYPE_SOURCE_MODE` is `union`, documented as keeping every source's
record for a day, each tagged with its own `sourceBridgeId`; when a consumer
needs a single value it takes the last one written. A confident "From: Garmin"
pill on a union-mode type would be reporting **write order** as if it were a
choice the user made. This change ships the question, and answers it only as far
as the state allows.

## What Changes

- **A read-only routing section** under the source cards: all thirteen managed
  data types, grouped Training / Recovery / Body, each row naming where the type
  comes from and, where such a route can exist, where Kaiord sends it on.
- **An origin derivation that reports mode honestly**:
  `sources = enabled import routes ∪ manual (where a manual path exists)`, then
  none → "No source"; one → that source; two or more under `priority` → the
  ranked head, the same one `resolveEffectiveSource` consults; two or more under
  `union` (the default) → **a count, never a name**.
- **Per-source freshness on each row**, read straight from `coachingSyncState`
  by source rather than through the Data Hub matrix. `coachingSyncState` is
  keyed by (source, profile) and carries no data type, so the copy names the
  SOURCE as the subject and the section says so once, in a header hint.
- **A Training / Recovery / Body grouping constant** with a parity test binding
  it to `managedDataTypes` — the grouping exists nowhere in `@kaiord/core`, and
  three types were already appended to that flat list in one PR.
- **Row descriptions** for all thirteen types in `en` and `es`, derived from
  what each schema actually carries.

Deliberately NOT shipped, because no state backs them:

- **"Also sent to" on eleven of thirteen rows.** Only `workout`
  (`write:workouts`) and `body-composition` (`write:body`) have an export
  capability at all; the design shows the affordance on Planned Session,
  Training Zones and Weight, which are import-only. Those rows omit it rather
  than saying "Nowhere" about a route that cannot be created.
- **Fallback display** ("WHOOP ~~struck~~ → Garmin · backup since <date>").
  `usedFallback` is priority-mode only, is per-(type, day), means "no record
  that day" rather than "this source broke", and is undefined for `strain`,
  `vitals` and `heart-rate-series` — including Strain, the row the design uses
  to demonstrate it.
- **"No source since <date>"**. "No source" is derivable; the date is not. No
  transition timestamp exists anywhere in the product.
- **"Baseline reset — 3 days of new data"** and **"Tanita would be more accurate
  here"** — no state at all behind either.
- **Per-type freshness.** "Sleep synced 2 minutes ago" is not expressible; the
  same instant belongs to every row that source feeds.

Out of scope: the inline "Change" control that picks a source of truth
(Wave 2b), the stats row and consequence banner (Wave 3), and retiring the Data
Hub matrix (Wave 4).

## Capabilities

### Modified Capabilities

- `spa-connections-page`: gains the per-data-type routing section — the origin
  derivation and what each origin is permitted to claim, the grouping
  completeness invariant, the export-affordance rule, and the constraint that
  binds freshness copy to the source rather than the data type. The capability
  itself is introduced by `add-connections-page` (Wave 1) and lands in
  `openspec/specs/` when that change archives; this change's delta is purely
  additive to it and neither restates nor contradicts a Wave 1 requirement.

## Impact

- **Package**: `@kaiord/workout-spa-editor` (private SPA) only. No domain,
  port or adapter-package change; no dependency added; no Dexie version bump.
- **Shared code touched**: none of the routing logic is widened.
  `buildSourcePolicyRows` keeps its `< 2 sources` skip — that skip is correct
  for gating a reorder control and is pinned by its test — so this ships its own
  derivation instead. The only shared change is extracting the
  `dataTypeSourcePolicy` live query out of `useSourcePolicies` into
  `useDataTypeSourcePolicies`, which both consumers now call; behaviour is
  unchanged.
- **Behaviour change**: none outside the new section. Nothing writes.
- **i18n**: `connections.routing.*` and `connections.dataTypeHints.*` added to
  both locales; covered by `resource-parity.test.ts` and by the extended
  `connections-data-types.test.ts`.
- **Tests**: `ConnectionsTab.test.tsx` now renders inside a
  `PersistenceProvider`, because the tab reads the persistence port for
  per-source freshness.
- **e2e**: no test id and no URL changed; `data-flows-density.spec.ts` exercises
  `/athlete`, not this section.
- **No** changeset (the SPA is private and excluded from the changeset-bot
  PUBLISHABLE set).
