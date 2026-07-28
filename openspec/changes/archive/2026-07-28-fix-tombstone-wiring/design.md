## Context

Delete propagation was designed as two cooperating pieces:

- `adapters/with-tombstones.ts` — a `PersistencePort` decorator that records a
  `[table+id]` tombstone in the same transaction as every id-keyed `delete(id)`
  on a snapshot-participating table.
- `application/sync/merge-snapshots.ts` — a last-write-wins merge that unions
  local and remote rows per table and drops any row whose `[table+id]` carries a
  tombstone newer than the row's own clock.

Both shipped with unit suites. Neither suite could see that `main.tsx:41` read
`createDexiePersistence()` with no decorator around it, so in production the
merge only ever saw an empty tombstone set. `importSnapshot` then wrote the
union back locally, which is why the resurrection was visible on the deleting
device first: `use-sync-auto-push` arms a push on the row-count change the
delete itself causes.

The sync APPLY path is a separate `SnapshotPort` (`importTables` does raw
`table.clear()` + `bulkPut`, never `PersistencePort.delete`), so there is no
feedback loop: a device cannot tombstone a deletion it merely received.

## Goals / Non-Goals

**Goals:**

- Wire the decorator, and make the wiring impossible to lose again silently.
- Establish and document a rule for which deletes may tombstone.
- Close the two user-facing deletes the decorator's shape cannot reach.
- State the remaining gaps plainly instead of leaving them implied.

**Non-Goals:**

- Tombstoning composite-primary-key tables (needs a tombstone-schema change).
- A profile-aware merge (its own wave — see Risks).
- Repairing remote snapshots already contaminated before this fix.

## Decisions

### D1 — The composition becomes a factory, because that is what makes it testable

The fix is one line long. Applied to `main.tsx` directly it would have stayed
exactly as untested as the line it replaced — the only available assertion would
be a regex over the source of an entry point that a test cannot import (it
mounts React into `document.getElementById("root")`).

`adapters/create-app-persistence.ts` exports
`createAppPersistence(db?) = withTombstones(createDexiePersistence(db))`, and
`main.tsx`, `dexie-junk-cleanup.ts` and the round-trip suite all consume it. The
proof test can now drive the real composition against real Dexie
(fake-indexeddb) and a shared fake cloud, so "is the decorator wired?" is a
behavioural assertion: delete on device A, sync both devices, assert the row is
gone on BOTH. Unwiring the factory fails five of those cases.

### D2 — The rule: user intent tombstones, mirrors do not

**A delete may record a tombstone only when it expresses user intent. A delete
that re-mirrors an upstream source, or repairs local state, must not.**

A tombstone is permanent and global. It is the right tool when a human said
"remove this", and the wrong tool whenever the delete is a local verdict derived
from state that may legitimately differ on another device.

`persistSyncedWeek` is the sharp case. It deletes local `coaching` rows the
Train2Go bridge no longer reports for the synced window. That is mirror
reconciliation: a network hiccup, an expired session, or a week the coach has
not published yet is indistinguishable from a real removal. Under a decorated
port, one short response would write a permanent cross-device tombstone over a
real coaching activity, and re-syncing could never bring it back — a strictly
worse bug than the resurrection being fixed.

The fix keeps that path off the decorated surface rather than weakening the
decorator: `CoachingRepository.deleteMirrorOrphan(id)` is behaviourally
identical to `delete`, and the decorator simply does not wrap it. The decorator
stays armed for `coaching`, so if a real user-intent coaching delete is ever
added it tombstones by default. (Today `coaching.delete` has no production call
site at all — dropping `coaching` from the decorated set would also have "worked",
and would have silently disarmed that future delete.)

### D3 — The heal's orphan drop does NOT tombstone either

`healSessionMatchIdShape` drops a legacy SHORT-form `sessionMatches` row when a
canonical COMPOSITE match already exists for the same activity. Applying D2:
this is a local repair, and the verdict rests on rows — the coaching activity
and the canonical match — that another device may not have synced yet.

On such a device the very same row is instead healed IN PLACE by
`rewriteIdShape`, which keeps the row's id and does not advance any timestamp.
`SessionMatch` carries only `createdAt`, so `recordClock` of the healed row is
older than a tombstone written on the first device, and the merge would suppress
it. The healed match would vanish permanently.

So the heal uses `SessionMatchRepository.deleteLocalOrphan(id)`, also outside the
decorated surface. `sessionMatch` remains decorated, which is what makes the
genuine user action on that table — `unmatchSession` — propagate correctly.

### D4 — Tombstones carry the SNAPSHOT table name, not the port key

`TOMBSTONED_TABLES` was a flat list of port repo keys used directly as the
tombstone's `table` field. For five tables the two names coincide. For two they
do not: the `coaching` repo writes the `coachingActivities` table and
`sessionMatch` writes `sessionMatches`. Since `mergeSnapshots` suppresses a row
by `[snapshotTable+id]`, tombstones filed under `coaching` / `sessionMatch`
could never have matched anything — the wiring fix alone would not have made
those two tables propagate.

`TOMBSTONED_TABLES` is now an explicit `portKey → snapshotTable` map, and a
guard test opens a real `KaiordDatabase` and asserts every value is an actual
table name.

### D5 — Deletes outside the decorator's shape tombstone in their use case

The decorator only sees repos exposing `delete(id: string)` plus `getById`. Two
user-facing deletes do not fit and resurrect today:

- `deleteLabReport` — `labs.deleteReport` plus `labs.deleteValuesByReport`;
  `labReports` and `labValues` both ride the snapshot.
- `deleteIntegrationPolicy` — `integrationPolicy.deleteById(id)`, the Data Hub
  "remove route".

Both now write their own tombstones inside the existing transaction, exactly as
`deleteConversation` already does for `chatMessages` + `chatConversations`. The
lab case tombstones every value it removes, not just the report, or the values
come back as orphans of a deleted report.

`deleteIntegrationPolicy` gains `IntegrationPolicyRepository.getById` so it can
apply the decorator's existence guard (never tombstone a no-op delete — that
would suppress a row another device still legitimately holds), and
`useDataHubRouteEditor` now reads the composed port from `usePersistence()`
instead of building a module-level Dexie repo, so the tombstone lands in the
same store and transaction runner as everything else.

### D6 — `Dexie.waitFor` around the AI-provider crypto

`aiProviders.getById` decrypts the stored API key with WebCrypto. The decorator
calls `getById` inside `port.transaction(...)`, and awaiting a non-Dexie promise
inside a Dexie transaction lets IDB auto-commit first — the wrap turned every
AI-provider delete into a `PrematureCommitError`. `Dexie.waitFor` keeps the
transaction alive across the await and is a plain pass-through outside one, so
the fix is contained in the adapter that owns the non-Dexie await.

### D7 — A coverage guard, so the next synced table cannot slip through

`adapters/tombstone-coverage.test.ts` enumerates every id-deletable repository
on a live `PersistencePort` (any `delete` / `deleteById` / `deleteReport` of
arity 1) and requires each to be classified: decorated, device-local, or on an
explicitly reasoned exception list. The classification table is asserted equal
in both directions, so it cannot rot into a vacuous pass. Current exceptions:
the three hand-tombstoned repos, the two non-`id`-keyed ones (`syncState`,
`userPreferences`), and the six health record repos, which expose `delete(id)`
but have no call site — with a comment telling a future author to make the D2
decision before wiring one.

## Risks / Trade-offs

### Known gaps this change does NOT close

- **Composite-primary-key tables are structurally untombstonable.**
  `aiModelBindings.delete(profileId, purpose)`,
  `autoMatchDismissal.delete(profileId, weekStart)` and
  `syncState.delete(source)` cannot be expressed as `[table+id]`, and
  `mergeSnapshots` only suppresses rows whose `row.id` is a string. Closing this
  needs a tombstone-schema change plus a merge change; it is not attempted here.

- **Profile-delete cascade orphans — a real new inconsistency.** After this fix,
  deleting a profile tombstones the `profiles` row, but the cascade that clears
  its per-profile data (workouts, coaching, sessionMatches, chat, health, labs)
  is local and per-row-untombstoned, and the merge has no profile-cascade rule.
  So that data returns from the remote as orphans owned by a profile that no
  longer exists. Today's behaviour is "everything comes back, consistently";
  post-fix it is "the profile is gone, its data is not". Still a net improvement
  — the delete the user asked for now sticks — but it needs its own wave, most
  likely a profile-aware merge rather than a per-row tombstone storm on delete.
  The false comment in `with-tombstones.ts` that claimed the cascade "removes a
  whole profile's data on every device independently" described this
  non-existent mechanism; it and the matching spec sentence are corrected.

- **Export-ledger rows orphan on a workout delete.** Same family as the
  profile-cascade orphan above. Deleting a workout now tombstones the workout,
  but the Dexie `deleting` hook in `dexie-export-ledger-cascade.ts` drops its
  `exportLedger` rows with NO tombstone, so those rows return from the remote
  pointing at a `kaiordRecordId` that no longer resolves.
  `sweepOrphanLedgerEntries` cleans them up, but that is the disaster-recovery
  path (new-machine restore), not something the routine sync invokes — so the
  orphans sit in the snapshot until it runs.

- **Already-contaminated remote snapshots keep their ghosts.** A row resurrected
  before this fix is now a legitimate row in the remote snapshot; nothing here
  retroactively removes it. The self-service remedy is to delete it once more —
  that delete now tombstones and sticks.

- **Mirror orphans are immortal in the snapshot, and visibly flap.** The direct
  consequence of D2: because `deleteMirrorOrphan` writes no tombstone, a
  coach-removed coaching activity is deleted locally, unioned straight back
  from the remote on the next merge, re-pushed, and deleted again on the
  following week-sync. The user sees a row that keeps reappearing. This is the
  accepted cost — the alternative is the data loss D2 exists to prevent — but
  it is a real defect, not a clean trade. Converging it needs a
  bridge-authoritative window (treat the upstream week's contents as the truth
  for that date range at merge time, so a row absent from an authoritative
  fetch is dropped without a permanent marker), which is a merge change and its
  own wave.

### Other trade-offs

- **`deleteMirrorOrphan` / `deleteLocalOrphan` widen three port types** for
  methods whose bodies are identical to `delete`. That is the point: the name is
  the seam, and it forces the D2 question at every future call site rather than
  hiding the answer inside a decorator condition. `removeUntouchedCoachingTemplates`
  takes the third one (`WorkoutRepository.deleteLocalOrphan`) via a `Pick` that
  deliberately withholds `delete`: it was protected only by hand-built raw repos
  two lines from the composition this change unified, so "tidy these up" would
  have silently armed a tombstone that destroys a user's EDITED workout on every
  device — the junk verdict reads `modifiedAt` and `createdAt === updatedAt` on
  the LOCAL row, and a device that has not merged the edit still sees a pristine
  template.

- **The existence probe holds the transaction across a decrypt.** `withTombstones`
  calls `repo.getById(id)` inside `port.transaction(...)` purely to learn whether
  a row existed, which for `aiProviders` means holding the IDB transaction open
  across a WebCrypto decrypt whose plaintext is discarded. Correct but wasteful.
  Fixing it means reshaping `IdDeletable` to carry a cheap `exists` probe, which
  is a wider refactor than this fix should absorb; recorded here as a known cost.
- **`useDataHubRouteEditor` switched from a module-level repo to
  `usePersistence()`**, which required a provider wrapper in its test. Building
  repositories outside the port is precisely how this bug class starts, so the
  change is deliberate; `useDataHubToggle` still does it, but it performs no
  deletes and is out of scope here.
