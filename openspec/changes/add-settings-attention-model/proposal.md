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
- **The banner counts exactly what the Connections section marks.** Attention
  is `source.status === "attention"` over the same `useConnectionSources` list
  the cards render, not a second predicate over the raw bridge rows. That
  derivation already resolves the cases a naive rule gets wrong: a bridge with
  no session prober (`tanita-bridge`, whose only session call downloads the
  whole export CSV) reads as installed, one whose first probe has not answered
  reads as checking, and an unlinked or absent one reads as available. A
  summary that can disagree with the surface it summarises is worse than no
  summary.
- **The banner and the chip render the same model, never together.** The index
  carries the banner; the rail carries the chip. An open section states the
  consequence once.
- **The Connections row counts detected bridges, not live sessions.** A
  session count cannot reach its own denominator — Tanita is never probed — so
  "4 of 5" would be a permanent ceiling that reads as a defect. `discovered`
  reaches 5 of 5. It says "detected", not "installed": a page cannot enumerate
  installed extensions, only those that announced themselves and answered a
  ping this page-life.
- **The row stays bare until the first refresh pass completes.** All five rows
  exist from the first render and read undiscovered because nothing has been
  asked yet, so a value rendered then would tell a fully equipped user
  "0 of 5" for as long as discovery takes. The store now exposes
  `hasRefreshed()` and notifies once when the first pass completes — that pass
  changes no row in an empty browser, so without the extra notification no
  consumer would ever hear the answer arrive.
- **The consequence line says only what state backs, ranked by what the reader
  can act on.** A sign-in instruction and an out-of-date extension each name
  their own fix and each routinely coexists with a `lastSyncAt` — you only get
  a re-auth demand for an account you were already syncing — so both outrank
  the date. `lastSyncAt` survives a reload, so "No new data since <date>" is
  sayable, in the reader's calendar day; `lastCheckedAt` records when the SPA
  last probed, so "down for three days" is not, and is not shipped. Everything
  else reads "Session signed out", the same verdict the card states and the
  wording the popups already use, because `needsReauth` is set by the
  TrainingPeaks probe alone and WHOOP genuinely cannot distinguish an expired
  token from never having signed in.
- **A protocol mismatch stops being reported as a session problem.** The ping
  probers answer an unsupported `protocolVersion` with a precise diagnosis
  ("Update your Kaiord … extension"), which the result type could not carry:
  it looked exactly like a dead session, and signing in again fixes nothing.
  `SessionProbeResult`, the runtime entry and the card's `ConnectionSource`
  gain an `outdated` flag, so the banner says "An extension is out of date —
  update it to resume". With no CTA, that line is the only channel the
  diagnosis has.
- **Both surfaces are polite live regions.** They appear seconds after the
  page renders and can appear again on any later poll, so a reader who is not
  looking at them is otherwise never told (WCAG 2.2 AA 4.1.3). Each truncated
  line also carries its full text as a tooltip.
- **The banner declares no action.** The Connections section can now act on a
  broken source — that was not true when this was first written, and it is why
  the slot exists — but the banner renders only on the index, where the row
  leading to that section sits directly beneath it. A button duplicating the
  row immediately below it is noise, so the slot stays unfed and the model
  keeps declaring it optional.
- **Six keys are added in `en` and `es`** — one row value and five attention
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
  application or port change; no dependency added; no Dexie schema change and
  no new table — bridge runtime state stays in memory, and the persistence
  boundary guard's file list is untouched (no bridge module was added, renamed
  or split).
- **Adapter change**: `SessionProbeResult` and `BridgeConnectionRuntime` each
  gain a required `outdated: boolean`, with an `outdatedExtension()`
  constructor beside `active()`/`inactive()`/`unreachable()` — reachable on
  purpose, since the extension answered. `BridgeConnectionStore` also gains
  `hasRefreshed()`.
- **Application change**: `BridgeSessionSignal` and `ConnectionSource` carry
  `outdated` through to the card, mirroring how `needsReauth` already travels.
  Consumers are unaffected; every fixture that CONSTRUCTS one of these gains a
  field — and `tsconfig.app.json` excludes `*.test.ts(x)`, so those were found
  by hand, not by `tsc`.
- **New files**: `connection-attention.ts`, `use-settings-attention.ts` and
  `use-connections-value.ts` under `components/pages/SettingsPage/`, plus
  three test modules. `useBridgeConnectionsRefreshed()` joins
  `hooks/use-bridge-connections.ts`.
- **Runtime cost**: the connection store now polls four bridges (Tanita is
  never messaged) every five minutes for the whole session, outside
  `BRIDGE_QUEUE`. That is the cost the dormant model was deferred against, and
  it is now paid for by two rendered surfaces.
- **i18n**: six keys added in both locales, none removed or re-worded.
- **e2e**: no test id and no URL change. `settings-attention-banner` and
  `settings-attention-chip` already exist; the Connections row gains an inline
  value, which no spec asserts on.
- **No** changeset (the SPA is private and excluded from the changeset-bot
  PUBLISHABLE set).
