## ADDED Requirements

### Requirement: ChatConversationRepository port

The persistence port SHALL expose a `ChatConversationRepository` for the `chatConversations` store. It SHALL provide: append/put a conversation row; list a profile's conversations ordered by `updatedAt` descending; rename a conversation (updating `title` and advancing `updatedAt`); touch a conversation (advance `updatedAt` on activity); delete one conversation row; and bulk-delete every conversation for a profile (the profile-delete cascade path). Ids SHALL be caller-supplied (nanoid). The `chatConversations` table SHALL be included in the snapshot export and the tombstone surface.

#### Scenario: List ordered by recent activity

- **GIVEN** a profile has multiple conversations
- **WHEN** the caller lists the profile's conversations
- **THEN** rows SHALL be returned ordered by `updatedAt` descending

#### Scenario: Conversation row appears in snapshot export

- **WHEN** a snapshot is exported for a profile that has conversations
- **THEN** the export SHALL include the `chatConversations` rows so cross-device sync can merge them

### Requirement: Per-conversation message reads

The `ChatMessageRepository` SHALL support reading and deleting messages scoped to a single conversation: list a conversation's messages in ascending `createdAt` order (optionally limited to the most recent N, still oldest-to-newest), and delete every message for a given `conversationId`. The existing per-profile bulk delete used by the profile-delete cascade SHALL be retained.

#### Scenario: Read a conversation's messages

- **WHEN** the caller lists messages for a `(profileId, conversationId)` pair
- **THEN** only that conversation's messages SHALL be returned, in ascending `createdAt` order

#### Scenario: Delete a conversation's messages

- **WHEN** the caller deletes messages for a `conversationId`
- **THEN** only that conversation's messages SHALL be removed; other conversations' messages SHALL remain

## MODIFIED Requirements

### Requirement: ChatMessageRepository

`PersistencePort` SHALL expose a `ChatMessageRepository` for chat transcripts with operations to append a message, list a profile's messages in `createdAt` order (optionally limited to the most recent N), list a single conversation's messages in `createdAt` order (optionally limited to the most recent N), delete every message for a `conversationId`, and bulk-delete every message for a profile. Records are profile- and conversation-scoped (`{ id, profileId, conversationId, role, content, toolName?, createdAt, usage? }`) with `createdAt` as an ISO-8601 string so the snapshot merge clock applies; rows are append-only (never updated in place). The store SHALL participate in the per-profile cascade delete and SHALL be included in the cloud-sync snapshot export, merged by `id` like other id-keyed tables. The per-profile bulk delete follows the existing per-profile cascade convention (no per-row tombstones — it runs independently on each device and propagates via the profile tombstone). An explicit single-conversation delete SHALL instead record one tombstone per deleted message (plus a `chatConversations` tombstone) so it propagates across devices instead of resurrecting on merge; that tombstoning lives in the `deleteConversation` use case (see the spa-chat-conversations capability), not in the repository.

#### Scenario: Chronological read per profile

- **WHEN** messages exist for profiles A and B and the chat page queries profile A's transcript
- **THEN** the repository SHALL return only profile A's messages ordered by `createdAt`

#### Scenario: Cascade delete on profile removal

- **WHEN** a profile is deleted
- **THEN** that profile's chat messages SHALL be removed by the same cascade that covers the other per-profile stores

#### Scenario: Transcript included in cloud-sync snapshot

- **WHEN** a cloud-sync snapshot export runs on a device with chat messages
- **THEN** the exported snapshot SHALL contain the `chatMessages` rows, and merging that snapshot on another device SHALL union the messages by `id` so both devices converge on the same transcript

#### Scenario: Deleted conversation messages do not resurrect on merge

- **GIVEN** device A and device B share the same synced transcript
- **WHEN** the user deletes a conversation on device A and a later sync merges device B's snapshot (which still contains the old messages)
- **THEN** the deleted messages SHALL remain deleted on both devices because the delete recorded a tombstone per deleted message plus a `chatConversations` tombstone
