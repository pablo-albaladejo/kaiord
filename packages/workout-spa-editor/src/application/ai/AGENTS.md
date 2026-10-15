<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-05-14 | Updated: 2026-05-14 -->

# `src/application/ai/`

## Purpose

CRUD use cases for AI provider configuration (add, update, remove, clear-all, the global custom-prompt setting) and the per-athlete model bindings (set, clear). Sits between the Settings UI and the `AiProviderRepository` port.

## Key Files

- `add-provider.ts` / `.test.ts` — append a new `LlmProviderConfig`.
- `update-provider.ts` / `.test.ts` — patch fields on an existing config.
- `remove-provider.ts` / `.test.ts` — delete by id; promotes the next provider to the internal `isDefault` fallback and deletes every athlete's bindings that pointed at it.
- `set-model-binding.ts` / `clear-model-binding.ts` — per-athlete provider+model per purpose; a blank model id is rejected (`EmptyModelIdError`).
- `clear-all-providers.ts` / `.test.ts` — wipe all providers (privacy panel).
- `set-custom-prompt.ts` / `.test.ts` — write the global system-prompt addendum (stored via the meta-row inside the AI repo).
- `errors.ts` — `*Error` types for the AI domain.
- `test-fixtures.ts` — canonical `LlmProviderConfig` shapes for tests.

## For AI Agents

### Working In This Directory

1. **The main model is the athlete's `default` binding.** `isDefault` on a provider is only the resolver's fallback when no binding exists; no UI sets it.
2. **Custom prompt is stored on the AI repo**, not in a separate table — `getCustomPrompt` / `setCustomPrompt` on the port (`null` = never set, `""` = user cleared).

### Testing Requirements

- Each use case has a `.test.ts` using `createInMemoryAiProviderRepository` from `../../test-utils/`.

### Common Patterns

- All exports are factories of the form `createAddProvider({ aiProviders })` returning a function.

## Dependencies

### Internal

- `../../ports/persistence-port` (`AiProviderRepository`).
- `../../store/ai-store-types` (`LlmProviderConfig`).

### External

- `zod` for validation on input.

<!-- MANUAL: -->

Provider secrets are never logged or sent to analytics — see PII-scrub rule (R-PIIInterpolation).
