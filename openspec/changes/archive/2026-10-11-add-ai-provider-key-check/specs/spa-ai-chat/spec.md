## ADDED Requirements

### Requirement: Chat prerequisites

The chat page SHALL say what it needs before it offers a conversation. Without an active profile it SHALL ask for one and link to the athlete page. When every provider is missing its key, as a provider restored from a backup is, it SHALL name that provider and link to Settings → AI. With no provider it SHALL show the provider setup prompt. A provider without a key SHALL never be offered to the chat.

#### Scenario: Only a restored provider without its key

- **GIVEN** the only AI provider is marked `apiKeyMissing`
- **WHEN** the user opens the chat
- **THEN** the page SHALL name that provider, offer a link to add its key, and render no composer

### Requirement: A failed turn leaves no uncaught rejection

A chat turn whose provider call fails SHALL surface the failure in the conversation and SHALL NOT leave an unhandled promise rejection in the browser.

#### Scenario: A rejected key in the chat

- **GIVEN** the provider answers the chat request with 401
- **WHEN** the user sends a message
- **THEN** the conversation SHALL show the authentication error with a retry, and the page SHALL report no uncaught error
