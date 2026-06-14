# SPA Persistence Port — Delta

## ADDED Requirements

### Requirement: ChatMessageRepository

`PersistencePort` SHALL expose a `ChatMessageRepository` for the chat transcript with operations to append a message, list a profile's messages in `createdAt` order (optionally limited to the most recent N), and clear all messages for a profile. Records are profile-scoped (`{ id, profileId, role, content, toolName?, createdAt, usage? }`) with `createdAt` as an ISO-8601 string so the snapshot merge clock applies; rows are append-only (never updated in place). The store SHALL participate in the per-profile cascade delete and SHALL be included in the cloud-sync snapshot export, merged by `id` like other id-keyed tables. A clear-conversation SHALL record one tombstone per deleted message so the clear propagates across devices instead of resurrecting on merge; the profile-cascade deletion follows the existing per-profile convention (no per-row tombstones — it runs independently on each device and propagates via the profile tombstone).

#### Scenario: Chronological read per profile

- **WHEN** messages exist for profiles A and B and the chat page queries profile A's transcript
- **THEN** the repository SHALL return only profile A's messages ordered by `createdAt`

#### Scenario: Clear by profile

- **WHEN** `clear(profileId)` runs for profile A
- **THEN** all of profile A's chat messages SHALL be deleted and profile B's messages SHALL remain

#### Scenario: Cascade delete on profile removal

- **WHEN** a profile is deleted
- **THEN** that profile's chat messages SHALL be removed by the same cascade that covers the other per-profile stores

#### Scenario: Transcript included in cloud-sync snapshot

- **WHEN** a cloud-sync snapshot export runs on a device with chat messages
- **THEN** the exported snapshot SHALL contain the `chatMessages` rows, and merging that snapshot on another device SHALL union the messages by `id` so both devices converge on the same transcript

#### Scenario: Cleared messages do not resurrect on merge

- **GIVEN** device A and device B share the same synced transcript
- **WHEN** the user clears the conversation on device A and a later sync merges device B's snapshot (which still contains the old messages)
- **THEN** the cleared messages SHALL remain deleted on both devices because the clear recorded a tombstone per deleted message

### Requirement: Dexie v21 migration

The Dexie schema SHALL add version 21 introducing the `chatMessages` store with primary key `id` and indexes `profileId` and `[profileId+createdAt]`. The migration SHALL be purely additive: no existing table is rewritten and no data transform runs.

#### Scenario: Fresh install at v21

- **WHEN** the SPA initializes IndexedDB on a device with no prior database
- **THEN** the database SHALL open at version 21 with the `chatMessages` store present and all pre-existing stores unchanged

#### Scenario: Upgrade from an earlier version to v21

- **WHEN** a device with a pre-v21 database loads the new build
- **THEN** the database SHALL upgrade to v21 adding the empty `chatMessages` store while preserving all existing rows in every other store

### Requirement: InMemoryChatMessageRepository

The in-memory persistence adapter SHALL implement `ChatMessageRepository` with the same observable behavior so chat use cases and components are unit-testable without IndexedDB.

#### Scenario: Unit test with chat persistence

- **WHEN** a chat use-case test appends and lists messages through the in-memory adapter
- **THEN** the results SHALL match the Dexie adapter's contract (profile scoping, chronological order, clear semantics)
