## MODIFIED Requirements

### Requirement: Provider reuse

The chat SHALL use the AI provider configurations already persisted in the `aiProviders`
store, instantiated through the existing `createLanguageModel()` factory. The conversation's
model SHALL be resolved through `resolveModelForPurpose()` for the `chat` purpose (the chat
override binding if set, otherwise the `default` binding, otherwise the default provider with
the catalog's default model), and the user SHALL be able to switch the active provider for
the conversation. The chat SHALL NOT introduce any new credential storage, SHALL NOT read a
model from the credential record, and API keys SHALL never appear in transcript records,
analytics events, toasts, or console output.

#### Scenario: Model resolved for chat on open

- **WHEN** the user opens `/chat` with at least one configured provider
- **THEN** the conversation SHALL use the provider and model returned by
  `resolveModelForPurpose()` for the `chat` purpose until the user selects a different
  provider

#### Scenario: Switching provider mid-conversation

- **WHEN** the user selects a different configured provider in the chat header and sends a
  message
- **THEN** the new turn SHALL be executed against the newly selected provider, using the
  model resolved for the `chat` purpose, and prior transcript messages SHALL remain unchanged
