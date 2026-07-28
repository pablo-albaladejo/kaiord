## 1. Composition

- [x] 1.1 Add `adapters/create-app-persistence.ts` exporting `createAppPersistence(db?)` = `withTombstones(createDexiePersistence(db))`, documented as the single composition point production and tests share.
- [x] 1.2 Point `main.tsx` at `createAppPersistence(db)` instead of the bare `createDexiePersistence()`.
- [x] 1.3 Point `adapters/dexie/dexie-junk-cleanup.ts` at the same factory so no second composition of the port survives.

## 2. Decorator correctness

- [x] 2.1 Turn `TOMBSTONED_TABLES` into an exported `portKey → snapshotTable` map; fix `coaching` → `coachingActivities` and `sessionMatch` → `sessionMatches`.
- [x] 2.2 Write the mapped snapshot table name into the tombstone's `table` field, since `mergeSnapshots` suppresses rows by `[snapshotTable+id]`.
- [x] 2.3 Wrap the AI-provider encrypt/decrypt in `Dexie.waitFor`, so `getById` is safe inside the decorator's transaction (it otherwise throws `PrematureCommitError`).

## 3. Reconciliation deletes must not tombstone

- [x] 3.1 Add `CoachingRepository.deleteMirrorOrphan(id)` to the port, the Dexie adapter and the in-memory twin, documented as outside the decorated surface.
- [x] 3.2 Use it in `persistSyncedWeek` for the coach-removed orphan drop, with the reason at the call site.
- [x] 3.3 Add `SessionMatchRepository.deleteLocalOrphan(id)` to the port, the Dexie adapter and the in-memory twin.
- [x] 3.4 Use it in `healSessionMatchIdShape`'s `dropOrphan`, justified by the `createdAt`-only clock on `SessionMatch` (design D3).

## 4. Deletes outside the decorator's shape

- [x] 4.1 `deleteLabReport`: record `[labValues+id]` per removed value plus `[labReports+id]`, inside the existing transaction; widen `LabPersistence` to include `tombstones`.
- [x] 4.2 Add `IntegrationPolicyRepository.getById` (port, Dexie adapter, in-memory twin) for the existence guard.
- [x] 4.3 `deleteIntegrationPolicy`: run read → delete → tombstone in one transaction via a widened `DeleteIntegrationPolicyDeps`; no tombstone on a no-op delete.
- [x] 4.4 `useDataHubRouteEditor` reads the composed port through `usePersistence()` instead of building its own Dexie repo.

## 5. Documentation corrections

- [x] 5.1 Replace the false profile-cascade claim in `adapters/with-tombstones.ts` with what is actually true, including the orphan consequence.
- [x] 5.2 Correct the matching sentence in `openspec/specs/spa-persistence-port/spec.md`.
- [x] 5.3 Graduate the "Deletes record tombstones" requirement from the archived `google-drive-cross-device-sync` change into the domain spec, describing shipped behaviour plus the known gaps.

## 6. Tests

- [x] 6.1 `adapters/create-app-persistence.test.ts`: two devices over one fake cloud and real Dexie — A creates and syncs, B syncs, A deletes and syncs, B syncs; assert gone on BOTH and the merged snapshot carries the tombstone.
- [x] 6.2 Parameterise that round trip across template, profile, AI provider, unmatched session, lab report and data-hub route; plus a case for the lab VALUES of a deleted report.
- [x] 6.3 `adapters/tombstone-coverage.test.ts`: enumerate every id-deletable repo on the port and require decorated / device-local / explicitly excused, with the classification asserted in both directions.
- [x] 6.4 Same suite: assert every `TOMBSTONED_TABLES` value is a real table name on a live `KaiordDatabase`.
- [x] 6.5 `application/coaching/reconciliation-deletes-do-not-tombstone.test.ts`: mirror and local-repair deletes write no tombstone, while the user-intent delete on the same table still does.
- [x] 6.6 Update `delete-integration-policy.use-case.test.ts` and `use-data-hub-route-editor.test.ts` for the widened deps and the provider-backed hook.
- [x] 6.7 Verify the round trip fails without the fix: unwiring the factory fails 5 cases, removing the use-case tombstones fails the other 3, and mis-mapping `sessionMatch` fails the unmatch case plus both name guards.

## 7. Review round

- [x] 7.1 Copy the three delta-only scenarios into the durable domain spec (snapshot-table-name invariant, local-repair exemption, profile-cascade non-propagation), so the archive cannot bake in the divergence.
- [x] 7.2 DELETE `HealthRecordRepository.delete(id)` from the port, the Dexie adapter and the in-memory twin (zero callers, six snapshot tables), leaving a comment recording what a re-adder must decide; drop the six allow-list entries.
- [x] 7.3 Cross-check the coverage guard against `db.tables`: every non-`DEVICE_LOCAL` Dexie table needs a `SNAPSHOT_TABLE_BY_REPO` value or a commented `OFF_PORT_TABLES` entry — closes the blind spot `exportLedger` proves is real.
- [x] 7.4 Give `removeUntouchedCoachingTemplates` a named seam (`WorkoutRepository.deleteLocalOrphan`) via a `Pick` that withholds `delete`, plus a test asserting junk cleanup writes no tombstone.
- [x] 7.5 Record the mirror-orphan flapping gap in design.md and the domain spec, noting a bridge-authoritative window (not a tombstone) as the converging fix.
- [x] 7.6 Fix the unparseable test title and restore the `findByNaturalKey` distinction between "did not query" and "queried and found nothing".
- [x] 7.7 Note the existence-probe cost (transaction held across the AI-provider decrypt) in design.md as a known, deliberately unaddressed trade-off.

## 8. Guard premises

- [x] 8.1 Correct the `aiModelBindings` reason: NOT cascade-only — `clearModelBinding` is a user delete parked on the composite-PK gap, and the wrong comment would hide that from the next reader.
- [x] 8.2 Add the `covered ⊆ db.tables` back-assertion so a typo'd or pre-emptive `OFF_PORT_TABLES` key cannot rot silently or wave through a table that does not exist yet.
- [x] 8.3 `labValues` IS hand-tombstoned (by `deleteLabReport`); reword and move it, with `chatMessages`, out from under the composite-PK header — both have plain `id` PKs.
- [x] 8.4 `coachingDayNotes` PK is `id`, not a composite (`CORE_V20`), so it is tombstonable; fix the reason before it misleads a future day-note delete.
- [x] 8.5 Replace "no delete surface" with "cascade-only delete" on the 11 tables the profile cascade does clear (`PROFILE_DATE_TABLES` ×2, `PROFILE_ID_TABLES` health mirrors ×9).
- [x] 8.6 Name all three `exportLedger` delete sites (rollback, `deleting` hook, orphan sweep); record `bridges` as legacy/write-dead and NOT in `DEVICE_LOCAL` despite being device-scoped.
- [x] 8.7 Add the export-ledger orphan gap to the known-gaps list in design.md and the domain spec.

## 9. Verification

- [x] 7.1 `tsc -p tsconfig.app.json --noEmit` clean.
- [x] 7.2 `pnpm --filter @kaiord/workout-spa-editor lint` clean.
- [x] 7.3 Full SPA vitest suite green.
- [x] 7.4 Prettier clean; `pnpm test:scripts` unchanged-green.
- [x] 7.5 `npx openspec validate fix-tombstone-wiring` passes.
