# Design — retire-legacy-connection-surfaces

## D1 — The Athlete page drops the section instead of keeping a summary

Both options were open. Dropping won on three grounds.

**A summary is a fourth surface, and the programme exists to stop having
those.** The section's own bug is the argument: `AthleteConnections` read
`useDiscoveredBridges()` and never the `connections` record, so it reported
"Connected" for a source `/settings/connections` reports as available. Any
second surface can drift the same way, and the only defence is not building it.

**A summary would carry new claims.** It needs its own copy in two locales for
states it does not own — checking, attention, nothing-detected — for information
already stated one tap away. New claim surface for zero new information is how
this programme has produced its worst review findings.

**The entry point is not lost.** `Settings → Connections` is the first row of
the first group and already answers itself inline ("2 of 5 detected"), and
Settings is in the header on every route. The Athlete page keeps what it is
about: identity, thresholds, zones.

The cost accepted: a user whose muscle memory is Athlete → Connections has to
go through Settings once. That is one hop, against a surface that could
contradict the real one indefinitely.

## D2 — The Tanita → Garmin push lands on the Tanita card only

The instruction was "the Tanita/Garmin cards' Manage sections". It ships on
Tanita alone, because two copies would each own a live state machine.

`useTanitaGarminSync` holds the `reading → parsing → encoding → uploading`
machine in hook state. Two cards means two independent instances, and both
Manage panels can be open at once — each card owns its own `open` flag and the
grid renders both. A user can therefore press the same upload twice, and
nothing downstream collapses the second: `syncTanitaBodyComposition` re-reads
the CSV, re-encodes, pushes again, and writes a second `exportLedger` row.

A shared module-level in-flight guard would stop the double push but not fix
the display: the joining instance never receives `onPhase`, so the second card
would sit at "Ready to sync" through the whole upload it is running.

The Garmin end is not silent. Garmin's own Manage panel already lists Body
Composition under "Kaiord sends back", derived from its announced `write:body`
capability — so the route is named on both cards; only the trigger is single.
`canSync` still requires both bridges, so the Tanita button is disabled while
Garmin is missing rather than failing mid-push.

## D3 — Redirect, not route deletion

`/settings/:section?` is one route with a section segment, so the retired paths
are resolved inside `SettingsPage` rather than by new `<Route>` entries. The map
lives next to `isSettingsTab` in `settings-tab-views.tsx`: the two functions
answer the same question about the same string and must not drift apart.

Neither retired path ever accepted a query. The `?section=` anchor set is
`providers | custom-instructions | data-management`, none of which belonged to
Extensions or the Data Hub, and no call site ever built a query onto either
path. So the redirect carries nothing forward — unlike `LegacyTodayRedirect`,
which preserves `?date=` precisely because `/today` did accept one. Adding
query preservation here would be code for a URL that cannot exist.

## D4 — `application/data-hub/**` is not part of the demolition

The name is the trap: the matrix UI is gone, the matrix derivation is not.
`get_data_routes` calls `buildDataHubMatrix(INTEGRATION_REGISTRY, signals)` for
every answer it gives about where data comes from, and `buildDataRouteSignals`
supplies the live signals without touching React. Deleting the folder because
its name matches the deleted tab would have broken the assistant silently:
nothing type-checks the chat tools against the UI.

What did die with the UI is `source-policy-rows.ts`. Two of its three exports
(`buildSourcePolicyRows`, `reorderSources`) had no caller left; the third,
`orderSources`, is used by the Connections page's source-of-truth options and
moved to `application/connections/order-sources.ts` with the half of the test
file that still applies.

## D5 — Route deletion has lost its producer (reported, not resolved here)

`deleteIntegrationPolicy` — the use case that removes an `IntegrationPolicy`
row and writes its tombstone in the same transaction — had exactly one
production caller: `useDataHubRouteEditor.remove`, behind the matrix's
per-cell "Remove route" menu. That menu is gone. The chat tool's
`disable_route` upserts `enabled: false`; it never deletes.

The use case is kept. It is a port-level capability with its own tests and an
entry in the `tombstone-coverage` allowlist, and removing it would mean
rewriting that allowlist and the persistence spec's tombstone contract inside a
UI cutover. There is also no behavioural loss to users: a disabled policy and a
missing one read identically, because every consumer gates on `enabled`.

What is corrected here is the **claim**. `spa-persistence-port` asserted a
scenario triggered when "a Data Hub route is deleted by the user" — an action no
longer reachable from any surface. A requirement whose trigger cannot occur is
worse than no requirement, so the scenario now names the deletes that are
reachable and states that integration-policy deletion is a port capability
awaiting a producer. Whether to delete the use case or to give the Connections
page a real "remove route" affordance is a decision for a follow-up, with the
evidence recorded rather than buried.
