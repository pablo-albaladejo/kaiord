---
"@kaiord/workout-spa-editor": patch
---

The chat model picker shows what the conversation actually runs. It lists every account's models in one select (provider and model chosen together, never a blank model) and starts on "Same as main model (…)", naming the athlete's effective chat model as the AI settings resolve it, instead of falling back to the provider marked as default. A conversation's choice stays its own: it is stored on that conversation (or held for an unsaved draft) and never changes the athlete's settings, and picking "Same as main model" clears it so the conversation follows the settings again.
