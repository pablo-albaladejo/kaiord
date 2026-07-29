# Design — unified Connections section

## D1. What "connected" means for a bridge

Three rules were available.

| Rule                                              | Consequence                                                                                     |
| ------------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| Discovery only (today's cell rule)                | Disconnect is decorative — the record is written and never read.                                |
| Record must say `connected` (today's header rule) | Unsatisfiable: nothing writes that record. Every working bridge would read "available" forever. |
| **Discovery AND record ≠ `disconnected`**         | Chosen.                                                                                         |

The chosen rule is _absence-tolerant_: a missing record means "never
disconnected". That preserves today's observable behaviour for every existing
user with no migration, while making the record load-bearing the first time it
is written. Requiring an explicit `connected` record would have shown every
already-working bridge as disconnected until the user re-clicked Connect — a
regression dressed as a feature.

Consequence, implemented in the same change: `DataHubMatrix`'s column header and
`data-hub-cell-state`'s bridge branch both call the shared predicate. They had
diverged (header: record; cell: discovery), which is exactly why a green active
cell could sit under a "Not connected" header. `DataHubMatrixSignals.isBridgeOnline`
is renamed `isBridgeConnected` so the name states the composite rule; the
comment that documented the divergence as intentional is replaced by one
documenting the union.

`isSourceConnected` answers **false** for `manual`. The question it asks is
whether an account is linked, and manual entry has none; callers render "always
on" from the mechanism. Answering true would have flipped the Data Hub's manual
column header from "Always on" to "Connected".

## D2. "Has no prober" is asked, not inferred

A bridge with no session prober can never report a live session, so its card
says "installed" rather than connected. The first implementation inferred that
from runtime state — `discovered ∧ ¬checking ∧ lastCheckedAt === null`, which
is what the refresh pass writes for a probe-less bridge.

That inference is wrong. `bridge-connection-probe` writes the SAME shape for a
PROBED bridge whose extension id changes mid-probe, so a WHOOP or Garmin card
could show Tanita-specific copy about not being able to check without
downloading the whole export. The status now takes `hasProbe` — injected by the
hook from `SESSION_PROBES` — and a probed bridge with no answer on record reads
"checking", which is what is actually true of it.

## D3. Discovery is read from the store, not from `useDiscoveredBridges`

The page could read discovery directly, and it would light up a fraction of a
second sooner. It would also open a window in which discovery says "present"
while the store still holds the default undiscovered row — and that row has
`lastCheckedAt === null`, so D2's rule would report every bridge as "installed"
until the first probe resolved. Reading `discovered` from the same rows that
carry the session state makes the card internally consistent by construction;
the cost is a brief "Not connected" before the store's first pass, which is
what is actually known at that instant.

Capabilities are still read from `bridgeDiscovery` inside the memo. That is safe
because capabilities change only when an extension id changes, and an extension
id change always rewrites the store row that the memo depends on.

## D4. Chips are derived from cabled routes, never from the manifest

`bridge-supported-routes` exists because an announced token over-claims:
`read:body` spans eight managed types, and `trainingpeaks-bridge` announces
`write:body` while `SUPPORTED_EXPORT_TYPES` for it is `[]` — the SPA cables no
export. A chip derived from the manifest would tell the user Kaiord pushes data
it has never pushed. `bridgeRouteTypes` intersects both, and a pinned test
asserts TrainingPeaks' export list is empty.

An undiscovered extension has announced nothing. The card renders no chips
rather than a guess, and the Manage panel says "Unknown until the extension is
running" rather than "Nothing" — the two are different facts.

## D5. "Sync now" exists for four bridges, not five

Every bridge pull lived inside a `useEffect` with a once-per-profile ref,
mounted only by the calendar page. The four whole-window pulls (garmin, whoop,
trainingpeaks, tanita) are plain functions of `(persistence, extensionId,
profileId)`, so they move to `hooks/bridge-import/` and both the auto hooks and
the button call the same runner — the alternative, re-wiring each use case at
the button, would have created a second definition of "what a Garmin sync is".
All four upsert by external id, which is what makes a second press safe.

`train2go-bridge` is excluded. Its import is `syncWeek(deps, profileId,
weekStart)`, scoped to whichever week the calendar is showing, and a settings
page has no week. Offering the button would mean inventing one, so the button is
not rendered for that card at all.

Guards: imports do not queue behind `BRIDGE_QUEUE`, and Tanita's downloads a
whole CSV per call, so nothing downstream provides backpressure. The hook holds
an in-flight guard plus a 60 s cooldown, and reports the cooldown rather than
silently ignoring the press.

## D6. No toasts on this page

`check-no-pii-leakage` requires a toast's first argument to be a bare string
literal or a top-level SCREAMING_SNAKE constant. `t("manage.syncDone")` is a
call expression and is rejected — correctly, since the rule cannot see what a
translator put in the string. Rather than allowlist the file, sync feedback
renders inline in the card as a `role="status"` line, which is also where the
user is looking.

## D7. Copy the product cannot honour, and what replaced it

| Design says                               | Shipped instead                             | Why                                                                                                                                                                                       |
| ----------------------------------------- | ------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| "Token expired · Jul 23"                  | "Session signed out"                        | `probeWhoopSession` leaves `needsReauth` false; no bridge distinguishes expired from never-issued. Only trainingpeaks ever propagates `needsReauth`, and that card gets a different line. |
| "primary for 6"                           | nothing                                     | The default multi-source mode is `union`, which has no ranked winner. A "primary" chip would report write order as a user choice.                                                         |
| "↑ 3 types out" (Garmin)                  | count from cabled routes                    | The real export ceiling is 2.                                                                                                                                                             |
| "stopped syncing 3 days ago"              | last-received-at, or "No data received yet" | No transition timestamp exists. `lastCheckedAt` says when Kaiord last probed, which is seconds ago after any reload however long the source has been quiet.                               |
| "Reconnecting backfills the last 30 days" | nothing                                     | True for WHOOP cycles, but HR and stress windows are 7 days. A single number would be wrong for two of four.                                                                              |
| "Connect" on an uninstalled extension     | an explanatory line                         | A web page cannot install a browser extension.                                                                                                                                            |
| "Notify me" on Strava/Wahoo               | a plain list                                | Nothing records an interest signal.                                                                                                                                                       |
| Amber card border for attention           | amber ring                                  | `border-edge` and an amber border are the same property at the same specificity, so which won would depend on stylesheet order. A ring is a different property.                           |

## D8. Bootstrap is mounted app-wide, not page-scoped

`useBridgeConnectionsBootstrap` could have been mounted by the Connections page,
which would keep polling to the surface that needs it. But `start()`/`stop()`
drive a 5-minute interval and a visibility listener whose 30-second positive
cache only pays off _across_ navigations — a page-scoped mount would re-probe
every bridge each time the page was opened, which is the opposite of the
budget the 0b design set out to protect. It is mounted in
`use-store-hydration`, and the test that asserted it was NOT mounted is flipped
to assert that it is.

## D9. Reused rather than re-implemented

`ConnectionMark`, `DisconnectConfirmation`, `ApiKeyConnectForm` and
`bridgePolicies` are imported from `organisms/AthleteConnections/`. They are
tested, and duplicating the API-key entry form in particular would have created
a second credential path. Wave 4 deletes the rows around them, not these.

`useDataFlows` is mounted once by the section rather than per card: every
Disconnect needs its bridge's policies, and the hook issues one query per
managed type per direction.

## D10. Known limitation — relative time is English-only

`formatRelativeTime` returns literal English ("2m ago"), by construction: its
return values are static so `check-no-pii-leakage` stays green on its callers.
Interpolated into the Spanish `lastSync` sentence it yields mixed language. This
is pre-existing — `settings.values.sync.connected` does the same — and a
locale-aware formatter is a separate change rather than something to fork here.

## D11. Liveness comes from the probe, and Tanita has none

`bridge-discovery` only ever `.set()`s an extension id — no delete, no TTL, and
`stop()` does not reset — so `discovered` could never go false. Uninstalling an
extension mid-session left the card asserting "detected" and "installed"
permanently, offered Reconnect for something that could not be re-linked, and
told the user to sign in when signing in fixes nothing.

Three options were on the table.

| Option                                                      | Verdict                                                                                                                                                                                                             |
| ----------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Expire an id in `bridge-discovery` when a ping fails        | Rejected: re-discovery needs a fresh announcement, and the `KAIORD_BRIDGE_DISCOVER` broadcast only fires once at boot when nothing is known. A transient failure would drop a bridge unrecoverably for the session. |
| A separate liveness `ping` for every bridge each pass       | Rejected after checking the extensions — see below.                                                                                                                                                                 |
| **Derive liveness from the probe each bridge already runs** | Chosen.                                                                                                                                                                                                             |

`sendBridgeMessage` now reports `delivered`, which is false only when the
message never reached the extension. `ok: false` from an extension that
answered still counts as delivered — it is there, it just said no. Probers map
a delivery failure to a new `unreachable()` result, and `probeBridge` writes
`discovered: result.reachable`. This costs no extra message: the probe was
being sent anyway.

The separate-ping option was rejected on evidence, not cost. `tanita-bridge`'s
background script routes `ping` into the same handler as `checkSession`
(`background.js`: `case "ping": case "checkSession": return await
checkSession()`), and that fetches the entire export CSV. A liveness ping would
therefore have re-downloaded the user's whole body-composition history every
five minutes — exactly the harm Wave 0b excluded Tanita from the probe set to
avoid. The other four bridges are already messaged every pass, so a second ping
would only duplicate real network calls for garmin, train2go and trainingpeaks.

**Residual, and it is a real limitation:** `tanita-bridge` is never messaged, so
its presence cannot be re-checked after the initial announcement. Rather than
assert something unobservable, its card says "Detected on load" and its detail
line states that Kaiord cannot re-check it and it may have been removed since.
`sessionVerifiable` on the card model carries this so the wording follows from
state rather than from a hardcoded bridge id. Lifting it needs a one-line
extension change — `case "ping"` returning the manifest without calling
`checkSession` — plus a store republish, which is extension-side work outside
this wave.

## D12. Both import guards are module-scoped

The in-flight guard was React state in `useBridgeImport`, which lives in the
Manage panel and is destroyed when the card collapses. Since the cooldown is
only stamped once a pull settles, collapsing and reopening mid-pull left
nothing at all in the way: a second concurrent whole-CSV download for Tanita,
repeatable without limit.

Both guards now live in `import-cooldown`. A second caller JOINS the in-flight
promise rather than being refused, so a card remounted mid-pull adopts the
running state and settles with the real outcome instead of sitting idle. Reading
the map synchronously also closes the two-fast-clicks gap that a captured
`status` could not.
