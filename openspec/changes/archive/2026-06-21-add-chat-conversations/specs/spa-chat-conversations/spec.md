## ADDED Requirements

### Requirement: Conversation entity

The SPA SHALL persist chat conversations as first-class rows in a `chatConversations` store, scoped per profile. Each conversation row SHALL carry `id`, `profileId`, `title`, `createdAt` (ISO-8601), `updatedAt` (ISO-8601), and an optional `providerId`/`modelId` per-conversation model override. Chat messages SHALL belong to exactly one conversation via a `conversationId` foreign key. A conversation and its messages SHALL be scoped to a single profile; conversations SHALL NOT be shared across profiles.

#### Scenario: Conversation is persisted on first message

- **WHEN** the user sends the first message of a new conversation
- **THEN** a `chatConversations` row SHALL be written for the active profile with a generated `id`, the auto-generated title, and equal `createdAt`/`updatedAt`, together with the first message in a single transaction, and the row SHALL survive a reload

#### Scenario: Messages reference their conversation

- **WHEN** the user sends a message in a conversation
- **THEN** the persisted `chatMessages` row SHALL carry the `conversationId` of that conversation and SHALL be readable through the `[profileId+conversationId+createdAt]` index in chronological order

### Requirement: Conversation list

The chat page SHALL render a list of the active profile's conversations, ordered by `updatedAt` descending (most recently active first), read via a live query so that creating, renaming, deleting, or appending to a conversation re-renders the list. The list SHALL indicate which conversation is currently active.

#### Scenario: List shows conversations newest-active first

- **GIVEN** the profile has conversations A and B
- **WHEN** the user sends a message in conversation A while B was previously on top
- **THEN** A SHALL move to the top of the list (its `updatedAt` advances) and the change SHALL appear without a manual reload

#### Scenario: Empty profile shows a starting state

- **WHEN** the user opens the chat with zero conversations for the active profile
- **THEN** the page SHALL present a way to start the first conversation, and sending the first message SHALL create a conversation implicitly

### Requirement: New conversation draft

Starting a new conversation SHALL open an empty in-memory draft and make it the active conversation; no `chatConversations` row SHALL be persisted until the user sends the first message. "New conversation" SHALL be idempotent: invoking it while the active conversation is an already-empty draft SHALL be a no-op rather than opening a second draft. As a result the conversation list SHALL never contain a titleless message-less conversation.

#### Scenario: New conversation opens an empty draft

- **WHEN** the user activates "New conversation"
- **THEN** an empty thread SHALL render with the composer enabled, no new `chatConversations` row SHALL be persisted yet, and the row SHALL be persisted only when the first message is sent

#### Scenario: New conversation is idempotent on an empty draft

- **GIVEN** the active conversation is an empty draft with no messages
- **WHEN** the user activates "New conversation" again
- **THEN** no additional draft or row SHALL be created and the same empty draft SHALL remain active

### Requirement: Auto-generated, editable title

A conversation's title SHALL be auto-generated from the user's first message, trimmed and truncated to a bounded stored length (~80 characters, with an ellipsis when cut); the conversation list MAY truncate it further visually. The user SHALL be able to rename a conversation to any non-empty title; renaming SHALL advance the conversation's `updatedAt`. An empty or whitespace-only rename SHALL be rejected and leave the prior title unchanged.

#### Scenario: Title derived from first message

- **WHEN** the user sends the first message of a draft conversation
- **THEN** the persisted conversation's title SHALL be set to the trimmed message text truncated to the bounded stored length

#### Scenario: Manual rename

- **WHEN** the user renames a conversation to a non-empty value
- **THEN** the new title SHALL persist, the list SHALL reflect it, and `updatedAt` SHALL advance

#### Scenario: Empty rename rejected

- **WHEN** the user attempts to rename a conversation to an empty or whitespace-only title
- **THEN** the rename SHALL be rejected and the existing title SHALL remain unchanged

### Requirement: Per-conversation model

Each conversation SHALL remember its own AI model via optional `providerId`/`modelId` on the conversation row. The active model for a turn SHALL be the conversation's override when set, otherwise the result of `resolveModelForPurpose('chat')` (so migrated and never-customized conversations behave exactly as before). Changing the model on a persisted conversation SHALL write the override to its row and advance `updatedAt`; changing it on a draft SHALL be held in memory and written when the conversation is first persisted.

#### Scenario: Model override is per conversation

- **GIVEN** conversation A has a model override set and conversation B has none
- **WHEN** the user switches between A and B
- **THEN** A's turns SHALL use A's override and B's turns SHALL use the `resolveModelForPurpose('chat')` fallback

#### Scenario: Override survives reload and sync

- **WHEN** the user sets a conversation's model and later reloads or syncs another device
- **THEN** the conversation SHALL retain its `providerId`/`modelId`, converging by `updatedAt` last-write-wins on conflict

### Requirement: Delete a single conversation

The user SHALL be able to delete one conversation. Deleting a conversation SHALL remove the conversation row and all of its messages while leaving every other conversation (and every other profile) intact. The deletion SHALL record a `[chatConversations+id]` tombstone plus the existing per-message `[chatMessages+id]` tombstones so it survives a subsequent cloud-sync merge. The delete SHALL run in a single persistence transaction.

#### Scenario: Delete removes only the target conversation

- **GIVEN** the profile has conversations A and B
- **WHEN** the user deletes conversation A
- **THEN** A and all of A's messages SHALL be gone, B and its messages SHALL remain, and no other profile SHALL be affected

#### Scenario: Deletion survives sync merge

- **GIVEN** cloud sync is configured on two devices sharing the same profile
- **WHEN** the user deletes a conversation on device A and a sync cycle completes on device B
- **THEN** the conversation SHALL NOT be resurrected on device B from a stale snapshot, because the conversation and message tombstones propagate the deletion

### Requirement: Conversations sync across devices

The `chatConversations` store SHALL participate in cross-device cloud sync through the snapshot/`recordClock` pipeline like the other per-profile stores. Because conversation rows are mutable (rename, and `updatedAt` advancing on activity), their merge SHALL resolve concurrent edits by last-write-wins on `updatedAt`. Conversation rows SHALL be included in the per-profile delete cascade via the profile tombstone like every other per-profile table.

#### Scenario: Rename converges across devices

- **GIVEN** cloud sync is configured on two devices sharing the same profile and conversation
- **WHEN** the conversation is renamed on device A and a sync cycle completes on device B
- **THEN** device B SHALL show the most recent title by `updatedAt`

#### Scenario: Conversations follow the profile cascade

- **WHEN** a profile is deleted
- **THEN** that profile's `chatConversations` rows SHALL be removed via the profile-tombstone cascade alongside its `chatMessages`
