<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-05-14 | Updated: 2026-05-14 -->

# `src/application/ai/`

## Purpose

CRUD use cases for AI provider configuration: add, update, remove, clear-all, set-default, and the global custom-prompt setting. Sits between the Settings UI and the `AiProviderRepository` port.

## Key Files

- `add-provider.ts` / `.test.ts` — append a new `LlmProviderConfig`.
- `update-provider.ts` / `.test.ts` — patch fields on an existing config.
- `remove-provider.ts` / `.test.ts` — delete by id; collapses default selection if needed.
- `set-default-provider.ts` / `.test.ts` — toggle the `isDefault` flag, ensuring exactly one default.
- `clear-all-providers.ts` / `.test.ts` — wipe all providers (privacy panel).
- `set-custom-prompt.ts` / `.test.ts` — write the global system-prompt addendum (stored via the meta-row inside the AI repo).
- `errors.ts` — `*Error` types for the AI domain.
- `test-fixtures.ts` — canonical `LlmProviderConfig` shapes for tests.

## For AI Agents

### Working In This Directory

1. **Set-default is an atomic toggle.** Reuse `persistence.transaction(fn)` so flipping the flag on one row while clearing it on another can't drift.
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
