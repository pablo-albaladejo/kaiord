## MODIFIED Requirements

### Requirement: Per-conversation model

Each conversation SHALL remember its own AI model via optional `providerId`/`modelId` on the conversation row. The active model for a turn SHALL be the conversation's override when set, otherwise the result of `resolveModelForPurpose('chat')` (so migrated and never-customized conversations behave exactly as before). Changing the model on a persisted conversation SHALL write the override to its row and advance `updatedAt`; changing it on a draft SHALL be held in memory and written when the conversation is first persisted. A model choice SHALL name a provider and one of its models together, and a blank or whitespace-only model id SHALL NOT be stored. Choosing to follow the main model SHALL clear a persisted conversation's override (advancing `updatedAt`) or drop a draft's held choice. A per-conversation choice SHALL NOT write the athlete's `chat` model binding.

The chat model picker SHALL show the model the conversation runs. While the conversation has no override it SHALL select a "Same as main model (<model> · <account>)" option naming the `resolveModelForPurpose('chat')` result, never the provider flagged `isDefault` by itself; when the athlete has a `chat` binding of their own the option SHALL say it follows the chat setting instead. The picker SHALL list every account's catalog models in one select, one group per account, with a free-text "Custom…" entry per account.

#### Scenario: Model override is per conversation

- **GIVEN** conversation A has a model override set and conversation B has none
- **WHEN** the user switches between A and B
- **THEN** A's turns SHALL use A's override and B's turns SHALL use the `resolveModelForPurpose('chat')` fallback

#### Scenario: Override survives reload and sync

- **WHEN** the user sets a conversation's model and later reloads or syncs another device
- **THEN** the conversation SHALL retain its `providerId`/`modelId`, converging by `updatedAt` last-write-wins on conflict

#### Scenario: Picker follows the main model, not the default-flagged account

- **GIVEN** two accounts where the first carries `isDefault` and the athlete's `default` binding runs `gpt-5-mini` on the second
- **WHEN** a conversation without an override is open
- **THEN** the picker SHALL select "Same as main model (gpt-5-mini · <second account>)"

#### Scenario: Following the main model again clears the override

- **GIVEN** a persisted conversation with an override
- **WHEN** the user picks "Same as main model"
- **THEN** the row's `providerId`/`modelId` SHALL be removed, `updatedAt` SHALL advance, and its turns SHALL use `resolveModelForPurpose('chat')`

#### Scenario: A chat choice never writes the athlete's settings

- **WHEN** the user picks a model in the chat picker for a draft or a conversation
- **THEN** no `aiModelBindings` row SHALL be created or changed
