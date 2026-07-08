---
"@kaiord/ai": minor
---

feat(ai): centralize provider and prompt plumbing behind subpath exports

Adds two additive subpath exports to `@kaiord/ai`:

- `@kaiord/ai/providers` — provider model factory (`createLanguageModel`, with
  an opt-in `{ browser }` flag for the Anthropic direct-browser-access header),
  the SDK-sourced model catalog and its generation/freshness machinery,
  `resolveModelForPurpose`, and the provider/credential/binding types.
  `@ai-sdk/anthropic|openai|google` are now optional peer dependencies.
- `@kaiord/ai/prompts` — a versioned prompt registry (`definePrompt`/
  `resolvePrompt`), the workout-parser and chat system prompts, the generation
  user-prompt builder with its Spanish coaching dictionary, and the
  untrusted-data fence utility.

Existing root exports (`createTextToWorkout`, `createChatAgent`, `ChatTool`, …)
are unchanged. No breaking change.
