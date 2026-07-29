## Why

The Settings shell carries two attention surfaces — a banner above the index
and a chip on the section rail — and both render nothing, because nothing
computes attention. `add-settings-split-shell` shipped the seam deliberately
empty: putting "1 connection needs attention" in the locale catalogs before a
model could produce it would have been a sentence no code can say.

The model exists. `add-bridge-connection-model` built one
`BridgeConnectionState` per bridge — `discovered`, `sessionActive`, `error`,
`needsReauth`, `lastCheckedAt`, plus the persisted `lastSyncAt` — and exposed
it as `useBridgeConnections()`. It has no production consumer at all: the
bootstrap that starts the store is not mounted, and a test asserts that it is
not, so the whole model is dormant.

This change mounts it and feeds the two slots plus the Connections row's
inline value, with copy limited to what the state can actually support.

## What Changes

- **The connection store starts with the app.** `use-store-hydration` mounts
  `useBridgeConnectionsBootstrap`, so the five-minute poll, the discovery
  subscription and the visibility refresh exist once per boot. The test that
  pinned the store as unmounted now pins it as mounted.
- **"Needs attention" is `error !== null || needsReauth`.** Not the
  session-shaped rule (discovered, no session): `tanita-bridge` has no session
  prober by design — its only session call downloads the whole export CSV — so
  it is permanently session-inactive, and that rule would report a healthy
  Tanita as broken forever.
- **The banner and the chip render the same model, never together.** The index
  carries the banner; the rail carries the chip. An open section states the
  consequence once.
- **The Connections row counts installed bridges, not live sessions.** A
  session count cannot reach its own denominator — Tanita is never probed — so
  "4 of 5" would be a permanent ceiling that reads as a defect. `discovered`
  reaches 5 of 5.
- **The consequence line says only what state backs.** `lastSyncAt` survives a
  reload, so "No new data since <date>" is sayable; `lastCheckedAt` records
  when the SPA last probed, so "down for three days" is not, and is not
  shipped. A re-authorisation reads "Session signed out", the wording the
  popups already use, because `needsReauth` is set by the TrainingPeaks probe
  alone and WHOOP genuinely cannot distinguish an expired token from never
  having signed in.
- **The banner declares no action.** No surface in the SPA can fix a broken
  bridge today: `ExtensionsTab` lists three of the five bridges and offers a
  status refresh, not a fix. A CTA would be a dead end for WHOOP and
  TrainingPeaks. The action slot stays unfed until Wave 1's Connections page.
- **Five keys are added in `en` and `es`** — one row value and four attention
  strings. No bridge name is interpolated into any of them.

Out of scope: the Connections page and per-source cards, a manual refresh
control, a real disconnect, the row-level attention dot (`SettingsRow`'s
`status` prop stays unfed — the index already carries the banner), and any
"broken since" claim, which would need a new persisted table.

## Capabilities

### Modified Capabilities

- `spa-settings-shell`: the attention slots stop being presentational. The
  shell derives one attention model from the bridge connection model, renders
  it as a banner on the index and a chip on the rail, and answers the
  Connections row with a count whose denominator is reachable.

<!--
`spa-settings-shell` is still unpublished: it exists only as change deltas in
`add-settings-row-values` (archived) and `add-settings-split-shell` (active,
this change's base). The delta here therefore MODIFIES a requirement whose
current text lives in that sibling change, and the scenario "The shell renders
no attention today" it carries is superseded by this change. Whichever sync
publishes the capability must take this change's version of the requirement,
not the sibling's.
-->

## Impact

- **Package**: `@kaiord/workout-spa-editor` (private SPA) only. No domain,
  application, port or adapter change; no dependency added; no Dexie schema
  change and no new table — bridge runtime state stays in memory, and the
  persistence boundary guard's file list is untouched.
- **New files**: `connection-attention.ts`, `use-settings-attention.ts` and
  `use-connections-value.ts` under `components/pages/SettingsPage/`, plus
  three test modules.
- **Runtime cost**: the connection store now polls four bridges (Tanita is
  never messaged) every five minutes for the whole session, outside
  `BRIDGE_QUEUE`. That is the cost the dormant model was deferred against, and
  it is now paid for by two rendered surfaces.
- **i18n**: five keys added in both locales, none removed or re-worded.
- **e2e**: no test id and no URL change. `settings-attention-banner` and
  `settings-attention-chip` already exist; the Connections row gains an inline
  value, which no spec asserts on.
- **No** changeset (the SPA is private and excluded from the changeset-bot
  PUBLISHABLE set).
