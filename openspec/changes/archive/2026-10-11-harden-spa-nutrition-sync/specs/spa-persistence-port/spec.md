## MODIFIED Requirements

### Requirement: ChatMessageRepository

`PersistencePort` SHALL expose a `ChatMessageRepository` for chat transcripts with operations to append a message, list a profile's messages in `createdAt` order (optionally limited to the most recent N), list a single conversation's messages in `createdAt` order (optionally limited to the most recent N), delete every message for a `conversationId`, and bulk-delete every message for a profile. Records are profile- and conversation-scoped (`{ id, profileId, conversationId, role, content, toolName?, createdAt, usage? }`) with `createdAt` as an ISO-8601 string so the snapshot merge clock applies; rows are append-only (never updated in place). The store SHALL participate in the per-profile cascade delete and SHALL be included in the cloud-sync snapshot export, merged by `id` like other id-keyed tables. The per-profile bulk delete follows the existing per-profile cascade convention (no per-row tombstones). The cascade crosses devices through the `profiles` tombstone alone: the sync and the backup drop every per-profile row of a tombstoned profile (see "Deletes record tombstones"). An explicit single-conversation delete SHALL instead record one tombstone per deleted message (plus a `chatConversations` tombstone) so it propagates across devices instead of resurrecting on merge; that tombstoning lives in the `deleteConversation` use case (see the spa-chat-conversations capability), not in the repository.

#### Scenario: Chronological read per profile

- **WHEN** messages exist for profiles A and B and the chat page queries profile A's transcript
- **THEN** the repository SHALL return only profile A's messages ordered by `createdAt`

#### Scenario: Cascade delete on profile removal

- **WHEN** a profile is deleted
- **THEN** that profile's chat messages SHALL be removed by the same cascade that covers the other per-profile stores

#### Scenario: Profile cascade does not propagate per-row

- **GIVEN** two synced devices holding the same profile and its per-profile rows
- **WHEN** the profile is deleted on device A and both devices sync
- **THEN** the `profiles` row SHALL stay deleted on both devices while the per-profile rows return from the remote snapshot as orphans, which is the documented gap rather than the intended end state

#### Scenario: Transcript included in cloud-sync snapshot

- **WHEN** a cloud-sync snapshot export runs on a device with chat messages
- **THEN** the exported snapshot SHALL contain the `chatMessages` rows, and merging that snapshot on another device SHALL union the messages by `id` so both devices converge on the same transcript

#### Scenario: Deleted conversation messages do not resurrect on merge

- **GIVEN** device A and device B share the same synced transcript
- **WHEN** the user deletes a conversation on device A and a later sync merges device B's snapshot (which still contains the old messages)
- **THEN** the deleted messages SHALL remain deleted on both devices because the delete recorded a tombstone per deleted message plus a `chatConversations` tombstone

### Requirement: Deletes record tombstones

Deletes through `PersistencePort` that express USER INTENT SHALL record a tombstone so the removal propagates across devices instead of being restored by the next cloud-sync merge. The system SHALL provide a `tombstones` store with primary key `[table+id]` and fields `table`, `id`, `deletedAt` (ISO 8601) and optional `profileId`. The tombstone SHALL be written in the SAME transaction as the underlying delete, and SHALL NOT be written when the delete removed nothing. The `table` field SHALL carry the SNAPSHOT table name, not the port's repository key, because the merge suppresses a row by `[snapshotTable+id]`.

The port composition the application actually runs SHALL apply the `withTombstones` decorator over the Dexie adapter, and SHALL be expressed as one shared factory that both the application entry point and the tests consume, so the decorator/merge join is verifiable as behaviour.

The profile-delete cascade removes per-profile rows without per-row tombstones; the cross-device delete is the `profiles` tombstone. After `reconcileAutoProfile`, the sync SHALL drop every row of a per-profile table whose `profileId` has a `profiles` tombstone and no live profile row in the merged snapshot, before importing or pushing, and the backup export and import SHALL apply the same step. A row whose profile is merely absent, with no tombstone, SHALL be kept, because that profile may not have arrived yet.

Where a repository's delete does not fit the decorator's single-argument `delete(id)` shape, the owning use case SHALL write the equivalent tombstone itself inside the same transaction.

Deletes that DO NOT express user intent — reconciliation deletes that re-mirror an upstream source, and local-repair deletes that drop a row local state judges redundant — SHALL NOT record tombstones, and SHALL be exposed as distinct repository methods so they stay outside the decorated surface. Their orphan verdict depends on local state that may legitimately differ on another device, where the same row is live.

Known gaps, not closed by this requirement: composite-primary-key tables (`aiModelBindings`, `autoMatchDismissal`, `syncState`) are structurally untombstonable under the `[table+id]` key; remote snapshots contaminated before the wiring was fixed keep their resurrected rows until the user deletes them once more; deleting a workout tombstones the workout but not the `exportLedger` rows its Dexie `deleting` hook removes, so those return from the remote as orphans pointing at a dead `kaiordRecordId` until the disaster-recovery orphan sweep runs; and because mirror-orphan deletes write no tombstone, a coach-removed coaching activity never leaves the cloud snapshot — it is deleted locally, unioned back from the remote, re-pushed, and deleted again on the next week-sync, so the row visibly flaps. That flapping is the accepted cost of not tombstoning a mirror; converging it needs a bridge-authoritative window (the upstream week's contents treated as the truth for that range), not a tombstone. Tombstones compare wall clocks across devices: a device whose clock runs ahead can stamp an edit later than another device's delete, and that edit then beats the tombstone and the row returns. Tombstones are pruned after 90 days, so a device that stays offline longer than that can push rows whose deletes the other devices have already forgotten, and they return.

#### Scenario: Deleting a workout records a tombstone

- **WHEN** a workout is deleted through the application's composed `PersistencePort`
- **THEN** a `tombstones` row with `table = "workouts"`, the workout's `id`, and a `deletedAt` timestamp SHALL exist after the delete commits

#### Scenario: The delete survives the deleting device's own next sync

- **GIVEN** two devices synced to the same cloud snapshot both holding a workout
- **WHEN** the user deletes it on device A and device A syncs, then device B syncs
- **THEN** the workout SHALL be absent on BOTH devices, because the tombstone suppresses the copy the merge would otherwise restore from the remote snapshot

#### Scenario: Tombstone and delete are atomic

- **GIVEN** the underlying delete fails and rolls back
- **WHEN** the operation completes
- **THEN** no tombstone SHALL be recorded for that record

#### Scenario: A no-op delete records nothing

- **WHEN** a delete is issued for an id that is not present locally
- **THEN** no tombstone SHALL be recorded, so a row another device still holds is not suppressed

#### Scenario: Tombstones are filed under the snapshot table name

- **GIVEN** a repository whose port key differs from its table name, such as `coaching` over `coachingActivities` or `sessionMatch` over `sessionMatches`
- **WHEN** a row is deleted through it
- **THEN** the tombstone's `table` SHALL be the snapshot table name, so the merge can match the row it must suppress

#### Scenario: Mirror reconciliation does not tombstone

- **GIVEN** a synced coaching week whose upstream bridge returns fewer activities than the local store holds
- **WHEN** the sync removes the local rows the bridge no longer reports
- **THEN** no tombstone SHALL be recorded, so a short, empty or failed upstream response cannot write a permanent cross-device delete over a real activity

#### Scenario: Local repair does not tombstone

- **GIVEN** a legacy-shaped session match that local state shows is shadowed by a canonical match, or a workout local heuristics classify as an untouched template
- **WHEN** the repair drops that row
- **THEN** no tombstone SHALL be recorded, because another device may hold a healed or edited version of the same row that the tombstone would suppress permanently

#### Scenario: A delete outside the decorator's shape is tombstoned by its use case

- **WHEN** a lab report or its lab values are deleted by the user
- **THEN** the use case SHALL record the corresponding `[table+id]` tombstones in the same transaction, so those rows do not resurrect on the next merge

#### Scenario: A hand-tombstoned delete with no producer claims no user action

- **GIVEN** `deleteIntegrationPolicy`, whose only production caller was the retired routing matrix's per-route "Remove route" control
- **WHEN** the requirement is read
- **THEN** it SHALL be described as a port capability awaiting a producer, NOT as an action a user can take, because no surface can currently trigger it — turning a route off writes `enabled: false` and deletes nothing
- **AND** any surface that later offers route removal SHALL route it through that use case, so the tombstone is written in the same transaction

#### Scenario: A deleted profile's rows do not come back from Drive

- **GIVEN** two devices synced to a snapshot holding profile P with an intake and a wellness value
- **WHEN** device A deletes P and syncs, then device B syncs
- **THEN** neither device nor the pushed snapshot SHALL hold P's intake or wellness value

#### Scenario: A profile that has not arrived yet keeps its rows

- **GIVEN** a remote snapshot with an intake whose profile it does not carry and no tombstone names
- **WHEN** a device syncs
- **THEN** the device and the pushed snapshot SHALL keep that intake

### Requirement: Backup export

Settings → Privacy SHALL offer an "export my data" control that downloads one plain-JSON file `{format: "kaiord-backup", version: 2, manifest, tables, tombstones, nutrition}`, where `nutrition` is an empty stub (`intakeEntries`, `intakePresets` and `energyTargets` all `[]`) kept only so an app that reads version 1 reports an unsupported version instead of a file that is not a backup, and says that the file is not encrypted and holds no API key. The export SHALL reuse the snapshot export and a backup table policy that classifies every table of the schema:

- the user's records SHALL be included as the snapshot carries them;
- `syncState`, `coachingSyncState`, `connections`, `bridges` and the `tombstones` table SHALL be excluded; tombstones SHALL travel in the file's `tombstones` field;
- `aiProviders` SHALL be included without its `apiKey` field;
- `intakeEntries`, `intakePresets` and `energyTargets` SHALL be included in `tables` as the snapshot carries them;
- the rows of a profile with a `profiles` tombstone and no live profile row SHALL be left out of every per-profile table;
- a table the policy does not classify SHALL be left out, and a guard over the live schema SHALL fail until it is classified.

The export SHALL write nothing locally: an unclaimed default profile SHALL be written to the file with `origin: "local"` and SHALL stay `origin: "auto"` in the database, so the file never carries `origin: "auto"` and the export never makes the local profile syncable.

#### Scenario: The file carries the records and no secret

- **GIVEN** a clean browser whose default profile holds a workout, a wellness value, an intake and an AI provider with a key
- **WHEN** the user exports their data
- **THEN** the file SHALL contain the workout, the wellness value, the intake and the provider's configuration
- **AND** it SHALL contain no `apiKey`, no `syncState` and no `"origin":"auto"`

#### Scenario: Exporting leaves the default profile unclaimed

- **GIVEN** the active profile has `origin: "auto"`
- **WHEN** the user exports their data
- **THEN** the file SHALL carry that profile with `origin: "local"`
- **AND** the database SHALL still hold it with `origin: "auto"`

#### Scenario: A new table is classified before it can reach a file

- **GIVEN** a schema version that adds a table
- **WHEN** the backup coverage guard runs
- **THEN** it SHALL fail until the table has a backup rule

### Requirement: Backup import

Settings → Privacy SHALL offer an "import backup" control that reads a `kaiord-backup` file and merges it into this browser, never replacing its data. The file SHALL be validated first: a file of another format or with malformed rows SHALL be rejected as not a Kaiord backup, a `version: 1` file SHALL be read with its `nutrition` field folded into `tables` (the `updatedAt` clock backfilled as the v37 upgrade does), and a backup `version` this app does not know, or a `manifest.schemaVersion` newer than the local database, SHALL be rejected with a message asking to update the app. A rejected file SHALL write nothing.

The import SHALL export the local snapshot, merge it last-write-wins with the file (`mergeSnapshots`), reconcile the unclaimed default profile against the file's profiles with the same `reconcileAutoProfile` as cloud sync, and import the result, all in one read-write transaction together with the device-local rewrite, so a failure rolls everything back. The file SHALL contribute only the tables the backup table policy includes, rewritten by it: `syncState`, `coachingSyncState`, `connections`, `bridges` and any `apiKey` in a file SHALL be ignored. `meta` SHALL stay the device's own, except that the file's `activeProfileId` SHALL be adopted when the device has no valid active profile.

- Tombstones on either side SHALL suppress older rows, so a record deleted after the backup SHALL stay deleted.
- With one profile in the file, the default profile's rows SHALL be re-keyed onto it and the device SHALL end with that one profile active; with several, the import SHALL write nothing and ask which profile to join, then re-run with the choice.
- Each AI provider SHALL keep the encrypted key this device holds for it; a provider only the file has SHALL be stored without a key, marked `apiKeyMissing`, SHALL not become the default when the device has one, SHALL be listed in the provider settings as missing its key, and SHALL never be offered to an AI feature.
- Nutrition SHALL merge like every other included table; an intake deleted after the backup SHALL stay deleted and the summary SHALL carry no nutrition warning. The rows of a profile deleted after the backup (its `profiles` tombstone holds) SHALL be left out of every per-profile table. A version 2 file's `nutrition` stub SHALL be ignored.

The import SHALL end with a summary of the rows it added, updated and did not restore because they were deleted after the backup.

#### Scenario: A clean browser restores a backup under one profile

- **GIVEN** a backup of a profile with a workout, a wellness value, an intake and an AI provider
- **WHEN** a clean browser imports it
- **THEN** it SHALL hold that one profile, active, with the workout, the wellness value and the intake
- **AND** its own default profile's rows SHALL have moved onto that profile
- **AND** the provider SHALL be listed as missing its key

#### Scenario: Importing never wipes local data

- **GIVEN** a browser with records of its own and a newer copy of a row the backup also holds
- **WHEN** it imports the backup
- **THEN** its own records SHALL remain and the newer row SHALL not be overwritten

#### Scenario: A delete made after the backup holds

- **GIVEN** a workout deleted after the backup was exported
- **WHEN** the backup is imported
- **THEN** the workout SHALL stay deleted and the summary SHALL count it as not restored

#### Scenario: An intake deleted after the backup holds

- **GIVEN** an intake entry deleted after the backup was exported, on this device or on another device that synced the delete
- **WHEN** the backup is imported
- **THEN** the entry SHALL stay deleted on every device and the summary SHALL count it as not restored

#### Scenario: A version 1 backup still imports

- **GIVEN** a `version: 1` file whose intake rows sit in `nutrition` without `updatedAt`
- **WHEN** it is imported
- **THEN** its intake rows SHALL be restored with `updatedAt` taken from `loggedAt`

#### Scenario: Importing twice changes nothing

- **WHEN** the same backup is imported a second time
- **THEN** the database SHALL be unchanged and the summary SHALL report nothing added or updated

#### Scenario: A tampered file cannot bring secrets or cursors

- **GIVEN** a file that carries `apiKey`, `syncState`, `coachingSyncState` or `connections`
- **WHEN** it is imported
- **THEN** none of them SHALL be written

#### Scenario: A backup from a newer app is refused

- **GIVEN** a backup whose `manifest.schemaVersion` is newer than the local database
- **WHEN** the user imports it
- **THEN** nothing SHALL be written and the page SHALL ask to update the app

### Requirement: Nutrition syncs across devices

Intake entries and intake presets SHALL carry an `updatedAt` sync clock stamped by every writer, and their deletes through `PersistencePort` SHALL record tombstones. The `energyTargets` row is keyed by `profileId`, has no single-row delete and is removed only by the profile cascade, so it SHALL be classified as untombstonable; two devices holding a goal for one profile SHALL keep the most recently saved one. A snapshot that lacks a nutrition table SHALL be merged as carrying no information for it, so a device on an older build, which neither exports nor imports these tables, SHALL push the remote nutrition back unchanged. A write to `intakeEntries`, `intakePresets` or `energyTargets` SHALL arm the debounced auto-push like a workout edit (Dexie v37 indexes their `updatedAt`). A sync's import SHALL keep every live row written after its export read (a new key, or a row that changed since), in every table without a natural-key merge hook, unless the incoming row is newer by clock or a tombstone at least as new deletes it; every other live row SHALL be replaced by the merged snapshot.

#### Scenario: An intake created on one device reaches the other

- **WHEN** device A logs an intake and syncs, then device B syncs
- **THEN** device B SHALL hold the intake

#### Scenario: An intake deleted on one device leaves the other

- **GIVEN** two synced devices holding an intake
- **WHEN** device A deletes it and syncs, then device B syncs
- **THEN** neither device SHALL hold it

#### Scenario: The newest of two edits wins

- **WHEN** two devices edit the same intake and both sync
- **THEN** both SHALL hold the edit with the newest `updatedAt`

#### Scenario: An older build keeps the Drive nutrition

- **GIVEN** a remote snapshot with nutrition rows and tombstones
- **WHEN** a device whose snapshot has no nutrition tables syncs twice
- **THEN** the pushed snapshot SHALL still carry those rows and tombstones
- **AND** when the remote manifest is newer than that device's schema, the device SHALL refuse it before importing or pushing

#### Scenario: Logging an intake arms the auto-push

- **GIVEN** a device connected to Drive
- **WHEN** the user logs an intake, saves a preset or edits the goal
- **THEN** a debounced push SHALL be requested

#### Scenario: An intake logged during a sync survives it

- **GIVEN** a sync that has read the local snapshot and not yet opened its import
- **WHEN** the user logs or edits an intake in that window
- **THEN** the intake SHALL remain after the import, with the edit, and the next sync SHALL push it
