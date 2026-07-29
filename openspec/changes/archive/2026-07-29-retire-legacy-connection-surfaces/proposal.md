> Completed: 2026-07-29

## Why

`add-connections-page`, `add-connections-data-type-rows`,
`add-connections-change-source` and `add-connections-health-summary` built
`/settings/connections` into a surface that answers everything the three older
ones did, and answers it better: a disconnect that is read back, a per-bridge
sync, thirteen routing rows with a source-of-truth control, health counters and
a consequence banner.

The three older surfaces are still shipping. That is not merely redundant — two
of them are actively wrong:

- **Athlete → Connections** derives "Connected" from extension discovery alone.
  It never reads the `connections` record, so a source the user explicitly
  disconnected still reads as connected there while the Connections page reads
  it as available. Two surfaces, opposite answers, same state.
- **Settings → Data Hub** heads every bridge column "Not connected" above cells
  the same table draws as active, because its header demanded a
  `status === "connected"` record that nothing ever wrote.
- **Settings → Extensions** lists three of the five bridges from a hardcoded
  table, in copy that was never translated.

Leaving them up means the programme replaced three surfaces with four.

## What Changes

- **`/settings/extensions` and `/settings/data-hub` resolve to
  `/settings/connections`.** Both were linked from the Settings index and are in
  histories and bookmarks, so they redirect rather than falling through to the
  index. The redirect replaces its history entry so Back does not bounce.
- **The retired UI is deleted, not hidden**: `organisms/DataHub/**`,
  `ExtensionsTab`, `BridgeStatusRow`, `TanitaGarminSyncCard`, the
  `AthleteConnections` row tree, the five `hooks/data-hub` hooks that served
  only them, and the `data-hub` i18n namespace in both locales.
- **The Athlete page drops its Connections section outright** rather than
  keeping a summary. Rationale in design.md D1.
- **The Tanita → Garmin body-composition push moves into the Tanita card's
  Manage panel.** Placement rationale in design.md D2.
- **`application/data-hub/**` survives.** `buildDataHubMatrix` and
  `dataHubCellState` are the derivation behind the `get_data_routes` chat tool;
  `readBridgeSyncStates` feeds the routing rows and the connection model. Only
  the UI that shared their name is gone.
- **Spec sync**: `athlete-connections` loses its retired-page framing and the
  connect behaviour it claimed but never had; `spa-routing` stops classifying
  Settings as a meta modal; `spa-persistence-port` stops asserting a
  user-triggered route deletion that no longer has a producer.

## Impact

- Affected specs: `spa-connections-page`, `athlete-connections`, `spa-routing`,
  `spa-persistence-port`
- Affected code: `packages/workout-spa-editor/src/components/{organisms,pages}`,
  `src/hooks/{connections,data-hub}`, `src/application/{connections,data-hub}`,
  `src/i18n/locales/{en,es}`, `e2e/`
- No persisted-data change: no Dexie version bump, no migration. Every record
  the retired surfaces wrote is read by the surface that replaces them.
