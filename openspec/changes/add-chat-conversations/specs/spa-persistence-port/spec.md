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
