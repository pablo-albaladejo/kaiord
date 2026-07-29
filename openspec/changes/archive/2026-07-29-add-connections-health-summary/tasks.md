> Tasks: 52 completed, 0 deferred

## 1. One derivation, shared

- [x] 1.1 Move the attention predicate to `sourceNeedsAttention` in `application/connections/connection-source.ts` and re-export it from `connection-attention.ts` under its existing name. See design.md D1.
- [x] 1.2 Move `connection-attention.ts`'s private `dayOf` to `application/connections/calendar-day.ts`; both banners state the same date about the same source.
- [x] 1.3 Leave every existing S3 test untouched — the names both modules export are unchanged, which is the point of the re-export.

## 2. Coverage derivation

- [x] 2.1 Add `connection-coverage.ts` returning `covered`, `broken` and `paused` from one pass over `managedDataTypes`.
- [x] 2.2 Gate on ENABLED import policies. Establish from `hooks/bridge-import/*` that every runner resolves import policies before contacting a bridge, so a switched-off route delivers nothing.
- [x] 2.3 Include `MANUAL_ENTRY_TYPES` in `covered`. Establish that no bridge announces `read:workouts`, so a bridge-only count has a ceiling of 12 of 13 — the unreachable-denominator defect, one counter over. See design.md D3.
- [x] 2.4 Exclude manual entry from `paused`, and pin the asymmetry with a test: deriving `paused` as `!covered` silently drops 9 of the 13 types from the banner. See design.md D3b.
- [x] 2.5 Treat `checking` as delivering, so the headline does not twitch during every poll's probe.

## 3. The counters

- [x] 3.1 Add `connection-summary.ts`: detected, covered, attention, last sync.
- [x] 3.2 Count `bridgeDetected` over bridge-mechanism sources only — not live sessions (`tanita-bridge` has no prober, so the ceiling would be 4 of 5) and not manual/unsupported cards (they have no extension to detect). See design.md D2.
- [x] 3.3 Take `lastSyncAt`, never `lastCheckedAt`: the latter reads as seconds ago after every reload.
- [x] 3.4 Skip a `lastSyncAt` that does not parse rather than rendering `Invalid Date`.
- [x] 3.5 Render a placeholder, distinct from zero, until `useBridgeConnectionsRefreshed()`. Establish that S3's `connections.length === 0` guard covers a state production never reaches, so the reachable failure is "0 of 5" on every cold load. See design.md D5.
- [x] 3.6 Keep the tile copy in `connection-summary-tiles.ts` so it is asserted without rendering and the cold-load branch is written once.

## 4. The consequence banner

- [x] 4.1 Add `connection-consequence.ts` over the same source list, returning `null` when nothing needs attention.
- [x] 4.2 Name the paused types. Ship NO successor: `union` is the default mode and has no winner, so "fell back to Garmin" describes a mechanism the product does not have. See design.md D4.
- [x] 4.3 Say "is signed out", never "token expired" — indistinguishable from never-signed-in, and only trainingpeaks sets `needsReauth`.
- [x] 4.4 Date it from `lastSyncAt` in the reader's calendar day, only when exactly one source is affected.
- [x] 4.5 Ship NO breakage duration and NO "since <n> days" — no transition timestamp exists.
- [x] 4.6 Ship NO backfill promise: `CYCLES_WINDOW_DAYS` is 30 but HR and stress are 7, so one number would be false for two of WHOOP's types.
- [x] 4.7 Name a cause only for a lone affected source; with several, state the count alone.
- [x] 4.8 Report an unsupported protocol version as out of date, not as signed out.
- [x] 4.9 Declare no action: the fix is a sign-in on the provider's site, and the card that says so is directly below. See design.md D4b.
- [x] 4.10 Resolve the design's own paused-vs-fell-back contradiction in favour of paused.

## 5. Refresh all

- [x] 5.1 Add `refresh-cooldown.ts` (module-scoped, in-memory) and `use-connections-refresh.ts` calling `refresh({ force: true })`.
- [x] 5.2 Set the window to 60s, matching the visibility floor rather than the 30s positive cache: both trigger the same forced pass. Establish that `force` bypasses the cache by definition, that the floor lives in the visibility handler and not the store, and that probes run outside `BRIDGE_QUEUE`. See design.md D6.
- [x] 5.3 Join an in-flight pass instead of starting a second, read synchronously so two clicks in one tick cannot both start one.
- [x] 5.4 Stamp the window on failure too, so an erroring bridge is not retried in a tight loop.
- [x] 5.5 Report a refused press rather than swallowing it.
- [x] 5.6 Tanita renders installed, never a spinner. Already pinned twice by Wave 1 (`bridge-connection-store.test.ts` asserts `checking: false` and that the probe is never called; `connection-source-status.test.ts` asserts the `installed` verdict), and `force` reaches neither path — so NO third test is added. See design.md D7.

## 6. UI

- [x] 6.1 `ConnectionsHealth` above the cards, taking the `sources` and `byDataType` the tab already reads — no second hook, no second query.
- [x] 6.2 `ConnectionSummaryRow` + `ConnectionSummaryTile`, theme tokens only (`bg-surface`, `border-edge`, `text-ink-*`); every `border` carries a colour in the same class list.
- [x] 6.3 `ConnectionsBanner` as a polite live region — it appears seconds after the page and again on any later poll.
- [x] 6.4 `ConnectionRefreshButton` in the header.
- [x] 6.5 Give every new element a `data-testid`, following the section's `connections-*` convention.

## 6b. Review round

- [x] 6b.1 Attach the banner's date only when something is actually paused. Establish the reachable shape — one affected source, its types still covered elsewhere, a `lastSyncAt` from any past import — which read "Nothing has stopped … No new data since <date>". See design.md D4c.
- [x] 6b.2 State the precedence in the spec too: the loss-vs-date requirements were simultaneously satisfiable with nothing ranking them, which is a spec defect and not only a code one.
- [x] 6b.3 Replace the `hasRefreshed()` gate with a discovery-settled gate. Establish that `bridgeDiscovery.start()` only arms a timer, that the first pass writes five undiscovered rows with no awaits, and that `hasRefreshed()` therefore flips within microseconds of boot — so "0 of 5" was reachable and on screen for seconds. See design.md D5.
- [x] 6b.4 Derive the grace window from `DISCOVER_REQUEST_DELAY_MS + PING_TIMEOUT_MS` rather than writing a literal; open early on any detection so an equipped reader is not made to wait out a window whose answer is already known.
- [x] 6b.5 Stamp the clock at app boot in `use-bridge-discovery-bootstrap`, with module load as the floor — React runs child effects before parent ones, so a cold boot straight onto the page can render before the root has stamped.
- [x] 6b.6 Guarantee the placeholder resolves: a reader with no extensions is told so once the window elapses, pinned by its own test.
- [x] 6b.7 Apply the same gate to the Settings index row, and delete its `connections.length === 0` guard plus the test covering it — the snapshot reader synthesises a row per known bridge, so the empty list cannot occur. Fixing one surface alone would put "0 of 5" one click from "3 of 5".
- [x] 6b.8 Assert the gate with the REAL hook: `ConnectionsTab.test.tsx` had mocked `useBridgeConnectionsRefreshed`, so it asserted its own stub rather than the behaviour.
- [x] 6b.9 Mutation-check the round: guard removed → 2 consequence tests fail; gate forced open → 2 cold-load tests fail; gate forced never-open → the empty-browser test fails; cooldown effect removed → its test fails.
- [x] 6b.10 Qualify the coverage tile's note ("incl. manual entry") so "13 of 13" above "No source is sending Weight" reconciles. See design.md D5b.
- [x] 6b.11 Swap the paused-manual-type fixture from `tanita-bridge` to `trainingpeaks-bridge`: tanita has no prober, so it can only ever read `installed` and the test named the one scale bridge that cannot sign out.
- [x] 6b.12 Make `banner.noRoutes` source-count neutral — it said "switched on for it" under a plural title.
- [x] 6b.13 Clear the refresh cooldown message when the window passes, via `refreshCooldownRemaining`, so "Try again in a minute" does not outlive the minute.

## 7. Copy and verification

- [x] 7.1 Sixteen keys in `en` AND `es` in the same commit (`resource-parity.test.ts` fails on an EN-only file).
- [x] 7.2 Interpolate no source name into a toast or `console.*` (R-PIIInterpolation).
- [x] 7.3 State, for every test added, the reachable state it fails on — in the test body, not the commit message.
- [x] 7.4 `pnpm -r build`, SPA `test`, SPA `lint`, `pnpm test:scripts`, root `pnpm lint`, `playwright test --list`.
