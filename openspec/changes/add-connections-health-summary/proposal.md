## Why

`add-connections-page` shipped the source cards. A reader who opens
`/settings/connections` still has to read nine cards to answer the two
questions they came with: is my data arriving, and if not, what stopped?

The state to answer both exists. `useConnectionSources` resolves one status per
source; `coachingSyncState` records when each source last delivered; the
`IntegrationPolicy` rows every importer gates on record which types are
switched on for which bridge. Nothing reads them together.

This change adds the health header: four counters, a consequence banner, and
one refresh that covers every bridge instead of two.

It is also the densest claim surface in the redesign, and most of the reference
design's assertions here are not backed. They are enumerated and refused below
rather than softened.

## What Changes

- **Four counters, derived from the list the cards are rendered from.**
  `sources detected`, `types covered`, `needs attention`, `last data in`. No
  counter carries its own predicate: attention is `sourceNeedsAttention` over
  the same array the section maps, so the summary cannot contradict the cards
  beneath it.
- **The detected counter counts extensions, not sessions.** A live-session
  count cannot reach its own denominator — `tanita-bridge` has no session
  prober by design, since its only session call downloads the whole export CSV
  — so the counter would sit one short forever and read as a defect. This is
  the choice and the word the Settings index row already made.
- **The counters render nothing until the store has answered.** Every bridge
  row exists from the first render and reads undiscovered, because nothing has
  been asked yet — a count rendered then tells a fully equipped user "0 of 5"
  on every cold load. The row waits on `useBridgeConnectionsRefreshed()` and
  renders a placeholder, which is a different claim from zero.
- **"Types covered" counts manual entry; the label is written for that.** A
  type is covered when an enabled import route's source is present, OR the type
  has a real manual-entry path. Excluding manual would put the denominator out
  of reach: no bridge announces `read:workouts`, so `workout` can never be fed
  by an extension and the ceiling would be 12 of 13 — the same unreachable
  ceiling, one counter over. Including it means the number is about having a
  source, not about data being in flight, and it is worded that way rather than
  as the design's "data flowing".
- **The banner states which types stopped, and nothing else.** Types with an
  enabled route on a source needing attention, and no other source still
  delivering them. Every input exists. Where the broken source's types are all
  still delivered by something else the banner says so, and where it feeds no
  route at all it says that instead — both are reachable states and neither is
  a guess.
- **The banner dates itself from the last data received.** `lastSyncAt` is
  persisted and survives a reload. The date is attached only when exactly one
  source is affected, so one source's date is never presented as a set's.
- **One refresh covering every bridge, with a client-side cooldown.**
  `refresh({ force: true })` already fans out over `KNOWN_BRIDGE_IDS` with
  `Promise.allSettled`, so it genuinely replaces the old control that only
  re-detected garmin and train2go. But it bypasses BOTH the store's 30-second
  positive cache (that is what `force` means) and the 60-second visibility
  floor, which lives in the visibility handler and not in the store — and
  probes run outside `BRIDGE_QUEUE`, so nothing downstream pushes back. A held
  button would message four extensions as fast as they answer. The cooldown
  window matches the visibility floor: both trigger the same forced pass, so
  the button can never be more aggressive than switching tabs already is.
- **Tanita renders as installed, never as a spinner.** It is never probed, so
  it never enters `checking` and never leaves it. `bridgeSourceStatus` already
  resolves this from `hasProbe`; the refresh does not change it.
- **The calendar-day formatter is shared, not copied.** The Settings banner and
  this one state the same date about the same source; two formatters would
  eventually disagree about which day that was.
- **Sixteen keys in `en` and `es`.** No source name reaches a toast or a
  `console.*` call.

### Claims refused

Each was checked against code before being cut, and each would have shipped a
sentence the product cannot honour.

1. **"WHOOP stopped syncing 3 days ago"** — no transition timestamp is recorded
   anywhere. `lastCheckedAt` is when the SPA last probed, so after a reload it
   reads as seconds ago however long a source has been down. Shipped as "No new
   data since <date>", from the persisted `lastSyncAt`.
2. **"Sleep and HRV have quietly fallen back to Garmin"** — `union` is the
   default multi-source mode (`DEFAULT_DATA_TYPE_SOURCE_MODE`), and union
   returns every source's record with no winner, so nothing ever "takes over".
   `usedFallback` exists only in `priority` mode, is per-(type, day), and
   covers 6 of 13 types. Not shipped in any form; the banner names what stopped
   instead of naming a successor.
3. **"Its access token expired"** — the SPA cannot distinguish an expired token
   from never having signed in; only `trainingpeaks-bridge` propagates
   `needsReauth` at all. Shipped as "is signed out", the wording already
   settled on by the cards and the extension popups.
4. **"Reconnecting backfills the last 30 days"** — true for WHOOP cycle metrics
   (`CYCLES_WINDOW_DAYS = 30`) and false for stress and heart rate, which are
   `7`. A single number cannot be stated, and a per-type breakdown is not a
   banner. No backfill promise is made.
5. **"Reconnect WHOOP" as the banner's call to action** — the fix for a
   signed-out source is a sign-in on the provider's own site, which this page
   cannot perform. The card that says more sits directly below the banner, so a
   button here would either dead-end or merely scroll. The banner declares no
   action.
6. **"Active sources · 2 of 5 linked"** — unreachable as a session count, per
   above. Reworded and re-derived.
7. **"Data flowing · 9 of 13"** — the number is derivable but the words are
   not, unless manual entry counts as data flowing. It does not. See "Types
   covered" above.
8. **The design's own contradiction** — its banner says Daily Wellness "fell
   back" while its WHOOP card calls the same thing "paused". Resolved as
   paused, and only for types that genuinely lost every delivering source.

## Capabilities

### Modified Capabilities

- `spa-connections-page`: the section gains a health header above the cards —
  counters, the consequence of a broken source, and a refresh covering every
  bridge — all derived from the per-source state the section already resolves.

## Impact

- **Package**: `@kaiord/workout-spa-editor` (private SPA) only. No domain,
  application-port or adapter change; no dependency added; no Dexie schema
  change and no new table. Bridge runtime state stays in memory and the
  persistence boundary guard's file list is untouched — no `bridge-connection-*`
  module was added, renamed or split.
- **New files**: `calendar-day.ts`, `connection-coverage.ts`,
  `connection-summary.ts` and `connection-consequence.ts` under
  `application/connections/`; `refresh-cooldown.ts` and
  `use-connections-refresh.ts` under `hooks/connections/`;
  `ConnectionsHealth`, `ConnectionSummaryRow`, `ConnectionSummaryTile`,
  `ConnectionsBanner`, `ConnectionRefreshButton` and
  `connection-summary-tiles.ts` under `components/organisms/Connections/`.
- **Moved, not duplicated**: `needsAttention` becomes a re-export of
  `sourceNeedsAttention` in `application/connections/connection-source.ts`, and
  `connection-attention.ts`'s private `dayOf` becomes the shared `calendarDay`.
  Both keep their existing names and tests.
- **Runtime cost**: one extra forced pass per press, floored at 60 seconds. No
  new poll, no new subscription — `useBridgeConnectionsRefreshed` and
  `useConnectionSources` were already mounted by this section.
- **i18n**: sixteen keys added in both locales, none removed or re-worded.
- **e2e**: no test id and no URL change; the header adds ids rather than
  altering any. `settings-row-*` and `settings-panel-*` are untouched.
- **No** changeset (the SPA is private and excluded from the changeset-bot
  PUBLISHABLE set).
