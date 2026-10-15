> Tasks: 8 completed, 0 deferred

# Tasks

- [x] 1. Red first: the chat picker selects "Same as main model (…)" naming the effective chat model (not the `isDefault` account), lists every account's models, chooses provider and model together, and never commits a blank custom id.
- [x] 2. Red first: `resolveChatModels` runs a draft's own provider+model (healed past retirement) and otherwise the athlete's chat resolution; `resolveActiveChatModel` reports whether the conversation runs its own model.
- [x] 3. Red first: `useChatModelSelection` stores the chosen model on a persisted conversation, keeps a draft's choice in runtime state, clears the override on "Same as main model", and never stores a blank id.
- [x] 4. Red first: `setConversationModel` rejects a blank model id; `clearConversationModel` removes the override and advances `updatedAt`.
- [x] 5. E2E with every provider host blocked: the picker follows the main model, a draft's choice does not write a binding, the first message stamps it, and "Same as main model" clears it.
- [x] 6. Changeset: patch for `@kaiord/workout-spa-editor`.
- [x] 7. Red first (CodeRabbit): a draft's held choice is dropped once a saved conversation is open, so the next new conversation follows the main model (unit + e2e).
- [x] 8. Red first (review): a following draft persists with no override (runner unit + e2e incl. a later main-model change); the draft choice is scoped to its athlete; the picker remounts per conversation; an override whose provider was removed is cleared.
