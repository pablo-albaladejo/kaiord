## ADDED Requirements

### Requirement: Deletes record tombstones

Deletes through `PersistencePort` that express USER INTENT SHALL record a tombstone so the removal propagates across devices instead of being restored by the next cloud-sync merge. The system SHALL provide a `tombstones` store with primary key `[table+id]` and fields `table`, `id`, `deletedAt` (ISO 8601) and optional `profileId`. The tombstone SHALL be written in the SAME transaction as the underlying delete, and SHALL NOT be written when the delete removed nothing. The `table` field SHALL carry the SNAPSHOT table name, not the port's repository key, because the merge suppresses a row by `[snapshotTable+id]`.

The port composition the application actually runs SHALL apply the `withTombstones` decorator over the Dexie adapter, and SHALL be expressed as one shared factory that both the application entry point and the tests consume, so the decorator/merge join is verifiable as behaviour rather than as source text.

Where a repository's delete does not fit the decorator's single-argument `delete(id)` shape, the owning use case SHALL write the equivalent tombstone itself inside the same transaction.

Deletes that DO NOT express user intent — reconciliation deletes that re-mirror an upstream source, and local-repair deletes that drop a row local state judges redundant — SHALL NOT record tombstones, and SHALL be exposed as distinct repository methods so they stay outside the decorated surface. Their orphan verdict depends on local state that may legitimately differ on another device, where the same row is live.

Known gaps, not closed by this requirement: composite-primary-key tables (`aiModelBindings`, `autoMatchDismissal`, `syncState`) are structurally untombstonable under the `[table+id]` key; the profile-delete cascade propagates only the `profiles` tombstone, leaving per-profile rows to return as orphans of a deleted profile; remote snapshots contaminated before the wiring was fixed keep their resurrected rows until the user deletes them once more; deleting a workout tombstones the workout but not the `exportLedger` rows its Dexie `deleting` hook removes, so those return from the remote as orphans pointing at a dead `kaiordRecordId` until the disaster-recovery orphan sweep runs; and because mirror-orphan deletes write no tombstone, a coach-removed coaching activity never leaves the cloud snapshot — it is deleted locally, unioned back from the remote, re-pushed, and deleted again on the next week-sync, so the row visibly flaps. That flapping is the accepted cost of not tombstoning a mirror; converging it needs a bridge-authoritative window (the upstream week's contents treated as the truth for that range), not a tombstone.

#### Scenario: Deleting a workout records a tombstone

- **GIVEN** the application's composed `PersistencePort`
- **WHEN** a workout is deleted through it
- **THEN** a `tombstones` row with `table = "workouts"`, the workout's `id`, and a `deletedAt` timestamp SHALL exist after the delete commits

#### Scenario: The delete survives the deleting device's own next sync

- **GIVEN** two devices synced to the same cloud snapshot, both holding a workout
- **WHEN** the user deletes it on device A, device A syncs, and then device B syncs
- **THEN** the workout SHALL be absent on BOTH devices, because the tombstone suppresses the copy the merge would otherwise restore from the remote snapshot

#### Scenario: Tombstone and delete are atomic

- **GIVEN** an underlying delete that fails and rolls back
- **WHEN** the operation completes
- **THEN** no tombstone SHALL be recorded for that record

#### Scenario: A no-op delete records nothing

- **GIVEN** an id that is not present locally
- **WHEN** a delete is issued for it
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

- **GIVEN** a legacy-shaped session match that local state shows is shadowed by a canonical match
- **WHEN** the id-shape heal drops the shadowed duplicate
- **THEN** no tombstone SHALL be recorded, because another device may instead heal that same row in place and the tombstone would suppress the healed row permanently

#### Scenario: A delete outside the decorator's shape is tombstoned by its use case

- **GIVEN** a lab report with its lab values, or a Data Hub route
- **WHEN** the user deletes it
- **THEN** the use case SHALL record the corresponding `[table+id]` tombstones in the same transaction, so those rows do not resurrect on the next merge

## MODIFIED Requirements

### Requirement: ChatMessageRepository

`PersistencePort` SHALL expose a `ChatMessageRepository` for chat transcripts with operations to append a message, list a profile's messages in `createdAt` order (optionally limited to the most recent N), list a single conversation's messages in `createdAt` order (optionally limited to the most recent N), delete every message for a `conversationId`, and bulk-delete every message for a profile. Records are profile- and conversation-scoped (`{ id, profileId, conversationId, role, content, toolName?, createdAt, usage? }`) with `createdAt` as an ISO-8601 string so the snapshot merge clock applies; rows are append-only (never updated in place). The store SHALL participate in the per-profile cascade delete and SHALL be included in the cloud-sync snapshot export, merged by `id` like other id-keyed tables. The per-profile bulk delete follows the existing per-profile cascade convention (no per-row tombstones). NOTE: that convention does NOT make the cascade cross-device. Nothing re-runs the cascade on the other devices and the snapshot merge has no profile-cascade rule, so a profile delete propagates the `profiles` tombstone only: the per-profile rows come back from the remote as orphans of a deleted profile. See "Deletes record tombstones" for the known gap. An explicit single-conversation delete SHALL instead record one tombstone per deleted message (plus a `chatConversations` tombstone) so it propagates across devices instead of resurrecting on merge; that tombstoning lives in the `deleteConversation` use case (see the spa-chat-conversations capability), not in the repository.

#### Scenario: Chronological read per profile

- **GIVEN** messages exist for profiles A and B
- **WHEN** the chat page queries profile A's transcript
- **THEN** the repository SHALL return only profile A's messages ordered by `createdAt`

#### Scenario: Cascade delete on profile removal

- **GIVEN** a profile holding chat messages
- **WHEN** that profile is deleted
- **THEN** that profile's chat messages SHALL be removed by the same cascade that covers the other per-profile stores

#### Scenario: Profile cascade does not propagate per-row

- **GIVEN** two synced devices holding the same profile and its chat messages
- **WHEN** the profile is deleted on device A and both devices sync
- **THEN** the `profiles` row SHALL stay deleted on both devices while the per-profile rows return from the remote snapshot as orphans, which is the documented gap rather than the intended end state

#### Scenario: Transcript included in cloud-sync snapshot

- **GIVEN** a device with chat messages
- **WHEN** a cloud-sync snapshot export runs
- **THEN** the exported snapshot SHALL contain the `chatMessages` rows, and merging that snapshot on another device SHALL union the messages by `id` so both devices converge on the same transcript

#### Scenario: Deleted conversation messages do not resurrect on merge

- **GIVEN** device A and device B share the same synced transcript
- **WHEN** the user deletes a conversation on device A and a later sync merges device B's snapshot (which still contains the old messages)
- **THEN** the deleted messages SHALL remain deleted on both devices because the delete recorded a tombstone per deleted message plus a `chatConversations` tombstone
