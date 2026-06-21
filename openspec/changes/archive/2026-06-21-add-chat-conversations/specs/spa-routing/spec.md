## ADDED Requirements

### Requirement: Conversation deep-link route

The SPA SHALL register a deep-linkable route `/chat/:conversationId` in addition to `/chat`. The route SHALL be a routed page sharing the chat surface's classification (heading focus via `[data-route-heading]`, single "Chat page" live announcement, lazy-loaded). Navigating to `/chat/:conversationId` for a conversation owned by the active profile SHALL select it as the active conversation; navigating to `/chat` with no id SHALL render the list with the most-recently-updated conversation active (or the empty state when none exist).

#### Scenario: Deep link selects a conversation

- **WHEN** the user navigates to `/chat/:conversationId` for a conversation owned by the active profile
- **THEN** the chat page SHALL render with that conversation active and its thread visible

#### Scenario: Unknown or foreign conversation id

- **WHEN** the user navigates to `/chat/:conversationId` for an id that does not exist for the active profile
- **THEN** the page SHALL fall back to the conversation list (no thread selected) without crashing, and SHALL NOT leak another profile's conversation
