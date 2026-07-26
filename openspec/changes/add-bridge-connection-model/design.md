# Design

## Decision 1 — one in-memory singleton, never Dexie

Session liveness is a property of _this tab, right now_: it depends on a
cookie the SPA cannot read, an extension that may have been uninstalled since
the last boot, and an upstream API that may be down. Persisting it would
create a second source of truth that is stale the moment it is written — the
exact failure the bridge persistence-boundary guard exists to prevent. The
store is therefore a plain module-level singleton, parked on
`globalThis.__KAIORD_BRIDGE_CONNECTIONS__` so a Vite hot update cannot leave
mounted hooks subscribed to an orphaned instance (the `bridgeDiscovery`
precedent), and the guard's file list is extended to cover it.

The only persisted half is `lastSyncAt`, which already exists in
`coachingSyncState` and is written by the importers — the connection model
reads it, it never owns it.

## Decision 2 — only cheaply-probeable bridges join the probe set

A prober is only admissible if its action is cheap and side-effect free.
`tanita-bridge` fails that test: its `checkSession` is implemented as a full
`GET /en/user/export-csv` whose body is discarded, so polling it every five
minutes would re-download the user's entire body-composition history each
pass. It is therefore absent from `SESSION_PROBES`, and the store reports it
as discovered-only — exactly what the UI can render today anyway.

The store treats "no prober" as a first-class state rather than a special
case: any discovered bridge without an entry is reported
`{ discovered: true, sessionActive: false, error: null, lastCheckedAt: null }`
and is never messaged.

## Decision 3 — probes bypass the shared operation queue

`BRIDGE_QUEUE` serialises operations per bridge with concurrency 1 and shares
the protocol's 60-operations-per-hour ceiling across every consumer. A status
probe enqueued there would sit behind a 30-second Train2Go week read before
answering "are you connected?", and four bridges polling every five minutes
would burn 48 of the 60 slots/hour on their own, leaving almost nothing for
real data operations.

Probes are cheap, idempotent, and read-only, so they call `sendBridgeMessage`
directly with short timeouts (2s for pings, 5s for `checkSession`/`status`).
The rationale lives in the store's header comment so the next author does not
"fix" it by routing them through the queue.

## Decision 4 — positive-only 30-second cache

Copied verbatim in spirit from `store/train2go-detect`: caching a _negative_
result is what produced the "calendar still says Connect long after I signed
in" bug. A previous "session inactive" can mean the content script had not
been injected yet, no upstream tab was open, or a cookie was mid-refresh —
none of which should block the next probe. Only `sessionActive: true` is
cached, for 30 seconds, and `force` bypasses it entirely.

The visibility-triggered refresh is always forced: returning to the tab is
exactly when the user has just signed in elsewhere, so the cache must not
suppress the probe that would notice. It carries its own 60-second floor,
though — the 30-second positive cache would not stop an alt-tab burst from
re-probing every _negative_ bridge on every switch, which is precisely the
set a user with one installed extension has.

## Decision 5 — probers never throw

Each prober folds its bridge's failure vocabulary into one shape:
`{ sessionActive, error, needsReauth }`. A **clean** not-signed-in answer is
`sessionActive: false` with `error: null` — there is nothing to tell the user
beyond "connect". A **transport failure** keeps its diagnostic message
("Extension not available", "No session token captured"): the extension being
unreachable is a different problem from the user being logged out, and the
message is what makes that distinguishable in support. The ping-based probers
have no such message to keep — `sendBridgeMessage` failing is indistinguishable
from "not installed" at that layer — so they report `null` there.

A protocol mismatch carries the "Update your …" message; a dead cookie
session carries the bridge's own message plus `needsReauth`.

`Promise.allSettled` over the bridges means one unreachable extension cannot
abort the pass. The refresh pass keeps a defensive `try/catch` around each
probe anyway, because a rejection would strand the row on `checking: true`,
and the re-entrancy guard would then refuse every later probe for that bridge.

## Decision 6 — adapters replicate, they do not import

The garmin and train2go probes duplicate ~4 lines of protocol-version and
session-flag checking that also exist in `hooks/garmin-bridge-operations` and
`store/train2go-detect`. Importing either would violate the SPA boundary rules
(`adapters/**` may not reach into `hooks/**` or `store/**`) and would drag in
side effects — `train2go-detect` writes a Zustand store. Both existing call
sites stay untouched in this wave; collapsing them onto the probers is the
next wave's job, once the UI consumers move over.

## Decision 7 — one `useLiveQuery`, N point-gets

`coachingSyncState`'s primary key is `[source+profileId]` and the table has no
`profileId` index. Reading freshness for 5 bridges is therefore 5 point-gets,
which is correct to issue inside a single `useLiveQuery` — one query per
bridge would multiply the observable subscriptions, and a `filter()` scan
would read the whole table.

One reader, `readBridgeSyncStates`, backs all three consumers: the Data Hub
matrix (`useBridgeSyncStates`, replacing the two separate train2go + garmin
queries it used to run), the connection model (`useBridgeConnections`), and
the chat `get_data_routes` tool (`buildDataRouteSignals`, which was
train2go-only and now sees tanita/TrainingPeaks freshness like the matrix
does). It returns rows carrying BOTH the integration id and the bridge id,
because the matrix speaks the former and the connection model the latter;
`byIntegrationId` / `byBridgeId` index it either way.

## Decision 8 — the sync-source map instead of `bridgeId === source`

Four bridges store their freshness row under their own bridge id;
`train2go-bridge` stores it under `"train2go"` because the planned-session
import predates the bridge-id vocabulary and rows with that key already exist
on users' devices. Renaming would orphan them. `BRIDGE_SYNC_SOURCES` makes the
exception explicit in one place and `syncSourceFor` falls back to the bridge
id, so a future bridge needs no entry. `use-train2go-data` reads its source
key from the map too, so the exception has exactly one home. (The identically
named constants in the Dexie v28/v29 migrations are deliberately left alone:
migration code describes data as it was written at that version and must not
move when a live map does.)

## Decision 9 — the store ships unmounted

`useBridgeConnectionsBootstrap` exists and is tested, but nothing mounts it
yet. Starting it now would poll up to four bridges every five minutes with no
consumer rendering the result — cost with no signal, and a heartbeat visible
in extension logs that nothing explains. The wave that ships the first
connections UI adds one line to `use-store-hydration`.

The `coachingSyncState` dep on both importers went the other way: **required**,
not optional. Wave 0a already learned this with `supportsRoute` — an optional
dep is a silent no-op at the next call site that forgets it, and here the only
symptom would be a blank "last synced" cell noticed weeks later.

## Follow-up — give tanita-bridge a cheap session action

`tanita-bridge` joins `SESSION_PROBES` once the extension exposes a
lightweight session check. That is an extension-side change, not a SPA one:

1. Add a cheap probe action to `packages/tanita-bridge/background.js` (e.g. a
   `HEAD`, or a `Range`-limited `GET`, that only observes the redirect/HTML
   login signal instead of buffering the CSV).
2. Widen the `ALLOWED` path/method allowlist to admit it.
3. Regenerate the privacy-surface golden
   (`scripts/check-bridge-privacy-surface.mjs`).
4. Register the prober here and drop the "discovered-only" carve-out from the
   spec.

Until then `checkTanitaSession` stays in the transport for explicit
user-triggered flows only, carrying a header warning that it costs a full
export download.
