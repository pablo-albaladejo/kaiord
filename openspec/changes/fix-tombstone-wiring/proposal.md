## Why

`withTombstones` never wrapped the application's persistence port. `main.tsx`
composed a bare `createDexiePersistence()`, and the only non-test caller of the
decorator was the usage-retention prune in `dexie-junk-cleanup.ts`.

Everything downstream assumed the wrap. `mergeSnapshots` unions local and remote
rows and suppresses only those carrying a tombstone; `importSnapshot` writes the
merged result back locally. So with Drive sync on, **anything the user deleted
came back — on the deleting device itself, at the very next sync**, because
`use-sync-auto-push` arms a push on the row-count change the delete causes.

The bug survived because both halves were unit-tested in isolation — the
decorator records markers, the merge honours them — and nothing tested the join
between them.

Two further defects fall out of the same wiring:

- The decorator filed tombstones under the PORT REPO KEY. For `coaching` and
  `sessionMatch` that is not the snapshot table name (`coachingActivities`,
  `sessionMatches`), so those tombstones could never have matched a row.
- `aiProviders.getById` awaits WebCrypto. Run inside the decorator's transaction
  it auto-commits the IDB transaction first, so every AI-provider delete would
  have thrown `PrematureCommitError` the moment the wrap went live.

And two user-facing deletes ride the snapshot but sit outside the decorator's
`delete(id)` shape, so they resurrect regardless of the wiring: deleting a lab
report (`labReports` + `labValues`) and removing a Data Hub route
(`integrationPolicies`).

## What Changes

- Extract the composition into `adapters/create-app-persistence.ts`
  (`createAppPersistence(db?) = withTombstones(createDexiePersistence(db))`) and
  route `main.tsx` and `dexie-junk-cleanup.ts` through it, so production and
  tests share one composition and the join is testable as behaviour.
- Turn `TOMBSTONED_TABLES` into an explicit **port key → snapshot table name**
  map and export it; fix `coaching` → `coachingActivities` and `sessionMatch` →
  `sessionMatches`.
- **Protect reconciliation deletes from tombstoning.** Add
  `CoachingRepository.deleteMirrorOrphan` (used by `persistSyncedWeek`) and
  `SessionMatchRepository.deleteLocalOrphan` (used by
  `healSessionMatchIdShape`) — behaviourally identical to `delete`, but outside
  the decorated surface. The decorator itself is not weakened.
- Hand-tombstone the two out-of-shape user deletes: `deleteLabReport` (report +
  every value) and `deleteIntegrationPolicy`, following the precedent
  `deleteConversation` already set. `deleteIntegrationPolicy` gains a
  transaction plus an existence guard (new `IntegrationPolicyRepository.getById`)
  and `useDataHubRouteEditor` now reads the composed port instead of building
  its own repo.
- Wrap the AI-provider encrypt/decrypt in `Dexie.waitFor` so those repos are
  safe to call from inside a port transaction.
- Correct the false profile-cascade claim in `with-tombstones.ts` and in the
  domain spec, and graduate the never-graduated "Deletes record tombstones"
  requirement from the archived `google-drive-cross-device-sync` change.

Out of scope: composite-primary-key tables, the profile-delete cascade orphan
problem, and cleaning already-contaminated remote snapshots — see `design.md`.

## Capabilities

### New Capabilities

<!-- None. This is a wiring fix inside an existing capability. -->

### Modified Capabilities

- `spa-persistence-port`: graduates and tightens delete propagation — the
  application's composed port, the snapshot-table-name rule, the user-intent vs
  reconciliation distinction, use-case-level tombstones for deletes outside the
  decorator's shape, and an explicit statement of the remaining gaps.

## Impact

- **Package**: `@kaiord/workout-spa-editor` (private SPA) only. No domain,
  public API, dependency or schema change; no Dexie version bump.
- **New files**: `adapters/create-app-persistence.ts`,
  `application/integration-policy/delete-integration-policy-deps.ts`, plus three
  test suites (`adapters/create-app-persistence.test.ts`,
  `adapters/tombstone-coverage.test.ts`,
  `application/coaching/reconciliation-deletes-do-not-tombstone.test.ts`).
- **Persistence**: no migration. Behaviour change only — deletes now stick.
  Rows already resurrected into a remote snapshot stay until deleted again.
- **No** changeset: the SPA is private and outside the changeset-bot
  PUBLISHABLE set.
