> Completed: 2026-10-15

# Proposal: the chat model picker shows what the conversation runs

## Why

After the AI settings started showing the effective model (ai-settings-truth),
the chat page's model picker still told a different story:

1. With no choice of its own, the picker showed the provider flagged
   `isDefault` (or the first one), while the turn ran the athlete's `chat`
   resolution — which follows the main model, a `default` binding that may
   live on another account.
2. It picked a provider only. The model came from that provider's stored
   model, so a conversation could not run, say, `o3` on an OpenAI account.
3. Once a conversation had its own model there was no way back to following
   the athlete's settings.

## What Changes

- The picker is the same one-select-per-account list as AI settings
  (provider and model chosen together, "Custom…" per account, never a blank
  model), composed from the settings option builder.
- Its first option, "Same as main model (<model> · <account>)", is selected
  while the conversation has no model of its own and names the athlete's
  effective chat model; when the athlete set a chat model in settings it
  reads "Same as chat in Settings (…)".
- Semantics are kept: the choice is per conversation. A persisted
  conversation stores `providerId`/`modelId` on its row; a draft holds the
  choice in volatile runtime state until its first message stamps it. Nothing
  here writes the athlete's `chat` binding.
- Picking "Same as main model" on a persisted conversation clears its
  override (and advances `updatedAt`); on a draft it drops the held choice.
- `setConversationModel` rejects a blank model id.
- The chat page no longer reads the runtime `selectedProviderId`, which the
  workout generator's stale-provider fallback can set to the `isDefault`
  account.

## Impact

- `@kaiord/workout-spa-editor` only (patch). No Dexie schema change.
