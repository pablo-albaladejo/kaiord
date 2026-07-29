# Design — Settings attention model

## D1. "Needs attention" is a failure, not an absent session

The obvious predicate is `discovered && !sessionActive`: the extension is here
but it is not signed in. It is wrong, and measurably so.

`bridge-session-probes.ts` registers four probers — garmin, train2go, whoop,
trainingpeaks. `tanita-bridge` is deliberately absent, because its
`checkSession` action is implemented as a full export-CSV download, so polling
it would re-fetch the user's entire body-composition history every pass.
`refreshBridge` therefore takes the no-prober branch for Tanita and writes
`{ discovered: true, sessionActive: false, error: null, needsReauth: false,
lastCheckedAt: null }` — permanently, for as long as the extension is
installed. A session-shaped predicate would report a perfectly healthy Tanita
as broken forever, and no user action could ever clear it.

The predicate is `error !== null || needsReauth`, which Tanita never trips.

Its consequence is worth stating: a bridge the user has simply signed out of
is **not** attention. `inactive()` defaults `error` to `null`, so a clean
"not signed in" answer is a state, not a fault. Only a transport or protocol
failure (`inactive(messageOf(err))`) or an explicit re-authorisation demand
raises the surface. That is the honest reading — an unused source is not a
problem — and it keeps the banner silent for the common case of a user who
installed one bridge and never signed into another.

## D2. The counter counts something that can reach its denominator

The design's stats row reads "N of 5 syncing". With the probe set above, a
`sessionActive` count has a hard ceiling of 4 — Tanita cannot ever be the
fifth. Shipping a counter that structurally never completes trains the user to
read a healthy system as a broken one.

The row counts `discovered` instead and says so: "3 of 5 installed". Five of
five is reachable, and "installed" is exactly what `discovered` means — the
extension answered the discovery ping. It is also the vocabulary the wave plan
already fixed for Tanita's card ("installed", not "connected").

`use-connections-value.ts` passes `null` as the profile id on purpose: the
count reads `discovered` only, and `useBridgeConnections(null)` skips the
per-profile `coachingSyncState` read entirely, so the index does not pay for
timestamps it does not render.

## D3. Only two facts back a consequence line

The banner's second line is where invention is cheapest, so it is restricted
to state that survives a reload:

| Wanted copy                 | Backing state            | Shipped |
| --------------------------- | ------------------------ | ------- |
| "No new data since <date>"  | `lastSyncAt`             | yes     |
| "Session signed out"        | `needsReauth`            | yes     |
| "The last check failed"     | `error`                  | yes     |
| "Down for three days"       | none                     | no      |
| "Sleep fell back to Garmin" | none (union has no head) | no      |
| "WHOOP token expired"       | none                     | no      |

`lastCheckedAt` looks like a "broken since" timestamp and is not one: it
records when the SPA last probed, so after a page reload it is seconds old no
matter how long the source has been down. `lastSyncAt` is read from the
persisted `coachingSyncState`, so it is the one durable fact — hence "no new
data since <date>", which is true after a reload and after a fresh install.

"Session signed out" rather than "expired" is forced by the probers:
`needsReauth` is set only by `probeTrainingPeaksSession`, from an error that
carries the flag. `probeWhoopSession` returns `inactive(messageOf(err))` and
leaves it false, so for WHOOP the SPA cannot distinguish an expired token from
never having signed in. The popups already say "Session signed out"; the SPA
now says the same thing.

The date branch is taken only when exactly one connection is affected.
"No new data since 2026-07-20" alongside a count of three would attach one
source's date to a set.

## D4. No CTA, because no surface fixes a bridge

`SettingsAttentionModel.action` stays unfed. The only status surface today is
`ExtensionsTab`, which lists Garmin, Train2Go and Tanita — not WHOOP, not
TrainingPeaks — and offers "Refresh Status", not a fix. Sending a user whose
WHOOP session died to a page that does not mention WHOOP is worse than
sending them nowhere. Wave 1's Connections page is where the CTA becomes real,
and the prop is already there for it.

## D5. One surface at a time

Both slots take the same model, so feeding both unconditionally would state
the same consequence twice on one desktop screen. The index renders the
banner; an open section renders the chip on the rail. The rail is
`hidden md:block`, so a section on a phone shows no attention surface — the
banner is one tap away on the index, and the section the user deliberately
opened is not the place to repeat it.

## D6. Two subscriptions, not one shared read

`useSettingsAttention` (shell) and `useConnectionsValue` (row registry) both
call `useBridgeConnections`. Hoisting one call into `SettingsPage` and drilling
the result down would save one `useSyncExternalStore` subscription and — on the
index only — one `useLiveQuery`, at the cost of routing a value around the row
registry that `settings-group-types.ts` is built to resolve by key. The
registry pattern wins: the row names `valueKey: "connections"` like every other
row, and `useConnectionsValue` passes `null` for the profile (D2), so the
duplicate read touches Dexie zero times.

## D7. The bootstrap moves into store hydration, not into the page

`useBridgeConnectionsBootstrap` could be mounted by `SettingsPage`, which is
the only consumer. It is mounted by `use-store-hydration` instead: a store
that starts and stops with a page would re-probe every bridge on every visit
to Settings, and the 30-second positive cache is per-entry state that a
restarted store keeps but a remounted page re-triggers. One start per boot is
what the lifecycle's interval, discovery subscription and visibility floor were
written for.

The cost is real and was the reason the mount was deferred: four bridges
messaged every five minutes for the whole session. It buys two rendered
surfaces, which is the bar the deferral set.
