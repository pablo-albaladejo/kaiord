## MODIFIED Requirements

### Requirement: Chat assistant routed page

The SPA SHALL provide a chat assistant as a routed page at the base-relative URL `/chat`, classified as a routed page per the SPA surface-classification requirement (deep-linkable, heading focus via `[data-route-heading]`, single "Chat page" live announcement, lazy-loaded like the other pages). The page SHALL render the active profile's conversation list alongside the **active conversation's** thread and an input composer. A specific conversation SHALL be deep-linkable at `/chat/:conversationId`.

#### Scenario: Chat page is reachable and accessible

- **WHEN** the user navigates to `/chat` (from the navigation entry or a deep link)
- **THEN** the chat page SHALL render the active profile's conversation list and the active conversation's thread, focus SHALL land on the page's `[data-route-heading]` element, and the live announcer SHALL announce "Chat page" once

#### Scenario: Deep link to a conversation

- **WHEN** the user navigates to `/chat/:conversationId` for a conversation owned by the active profile
- **THEN** that conversation SHALL be the active conversation and its thread SHALL render

#### Scenario: No AI provider configured

- **WHEN** the user opens `/chat` with zero AI providers configured
- **THEN** the page SHALL render an empty state explaining that a provider is required and linking to the AI settings, and the message composer SHALL be disabled

### Requirement: Transcript persistence

The conversation SHALL be persisted per conversation: each `chatMessages` row (user, assistant, and tool-event entries) carries a `conversationId` foreign key into the `chatConversations` store, surviving reloads and read via a single live query for the active conversation on the chat page. Transcripts SHALL participate in cross-device cloud sync like the other per-profile stores, so the same conversations are available on every synced device. The user SHALL be able to delete an individual conversation (its messages and the conversation row) and to start a new conversation; the bulk delete-all path is no longer surfaced as "Clear conversation". Only a bounded window of recent messages **within the active conversation** SHALL be replayed into the model context per turn; the system prompt SHALL NOT be persisted.

#### Scenario: Transcript survives reload

- **WHEN** the user exchanges messages in a conversation, reloads the browser, and returns to `/chat`
- **THEN** the prior conversation SHALL render from persistence in chronological order

#### Scenario: Delete one conversation

- **WHEN** the user deletes a conversation and confirms
- **THEN** that conversation's messages and its conversation row SHALL be deleted and the page SHALL fall back to another conversation or the empty state, while other conversations and other profiles' transcripts remain intact, and the deletion SHALL survive subsequent cloud-sync merges (no resurrection from another device's snapshot)

#### Scenario: Transcript follows the user across devices

- **GIVEN** cloud sync is configured on two devices sharing the same profile
- **WHEN** the user converses on device A and a sync cycle completes on device B
- **THEN** device B's `/chat` page SHALL render the same conversations from device A, each thread in chronological order
