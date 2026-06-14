> Completed: 2026-06-14

# Add SPA AI Chat Assistant

## Why

The SPA already stores a rich, profile-scoped history (workouts, coaching activities, session matches, six health-metric stores) and already holds user-supplied LLM credentials for AI workout generation — but the only way to interrogate that history is manual navigation, and the only AI entry point is single-purpose (text → workout). A conversational assistant turns the existing data + existing credentials into an interactive surface ("what was my longest workout in the last 20 days?", "sync Train2Go", "log that I slept 7 hours") with zero new infrastructure, consistent with the SPA's client-only design.

## What Changes

- New chat assistant surface in `@kaiord/workout-spa-editor`: a routed page where the user converses with an LLM about their own data.
- The chat reuses the existing AI provider configs (Dexie `aiProviders` table, `LlmProviderConfig`) and the existing `createLanguageModel()` factory (`@ai-sdk/anthropic|openai|google`); no new credential storage.
- New chat engine in `@kaiord/ai`: a provider-agnostic multi-step tool-calling loop built on the Vercel AI SDK (`streamText`/`generateText` + `tools`), taking a `LanguageModel` and an injected tool registry (strategy pattern, same shape as `createTextToWorkout`).
- Read tools (Q&A): query/aggregate profile-scoped data through the existing `PersistencePort` repositories — workouts, coaching activities, session matches/compliance, and the six health stores — over caller-bounded date ranges. Raw rows are summarized client-side before being sent to the provider.
- Action tools (writes and side effects), each gated by an explicit in-chat user confirmation before execution:
  - Trigger a coaching sync via the existing `CoachingSource.sync()` use case (Train2Go).
  - Create a workout from a natural-language description via the existing `createTextToWorkout` pipeline + workout persistence use case.
  - Log a manual health metric (e.g. sleep duration) via the existing `save-manual-health-metric` use case.
- Chat transcript persistence: one rolling conversation per profile in a new Dexie table (`chatMessages`, schema v20), exposed via a new `ChatMessageRepository` on `PersistencePort` and read with one `useLiveQuery` per page. The transcript is included in the cross-device cloud-sync snapshot (Google Drive sync), with clear-conversation propagating deletion via tombstones.
- Chat LLM calls are recorded in the existing monthly `usage` table, alongside generation usage.
- Prompt-injection defense: persisted free-text that originated outside the user (coach descriptions, imported workout notes) is fenced as untrusted data in tool results, reusing the `spa-ai-batch` defense pattern.
- Privacy-policy content update: the LLM data-flow disclosure must now cover chat (workout and health summaries sent to the configured provider on user request).

## Capabilities

### New Capabilities

- `spa-ai-chat`: the chat assistant — surface and entry point, provider selection/reuse, tool-calling loop, read-tool data access boundaries, action-tool confirmation gating, transcript persistence and clearing, usage accounting, error states (no provider configured, provider failure, tool failure), and prompt-injection defense for untrusted persisted text.

### Modified Capabilities

- `spa-persistence-port`: adds the `ChatMessageRepository` contract (profile-scoped, cascade-delete on profile removal, in-memory test double) and the Dexie v20 migration adding the `chatMessages` store.
- `spa-routing`: classifies the chat assistant as a routed page (`/chat`) in the surface-classification requirement, with the standard focus/announcement behavior and no dual-mount.
- `privacy-policy`: the LLM provider data-flow disclosure expands to cover chat — historical workout and health data summaries are sent to the user-configured provider only when the user converses, and never to any Kaiord-operated server.

## Impact

- **Packages**: `@kaiord/ai` (new chat-engine adapter; public export), `@kaiord/workout-spa-editor` (UI, use cases, ports, Dexie migration, tools). `@kaiord/core` is unaffected (no new domain types beyond what tools reuse).
- **Hexagonal layers** (SPA-internal): `ports/` (new `ChatMessageRepository`; chat tool contracts), `application/chat/` (tool registry, confirmation gating, transcript use cases), `adapters/dexie/` (v20 migration + repository), `hooks/` (`use-chat-messages-live`), `components/pages/` (ChatPage) — UI never touches Dexie directly. In `@kaiord/ai`, the engine depends only on the AI SDK `LanguageModel` and injected tool strategies; the port (tool contract) is specified before any SPA adapter implements it.
- **Dependencies**: no new runtime dependencies — `ai` + `@ai-sdk/*` are already SPA dependencies; the engine in `@kaiord/ai` adds `ai` as a peer/dependency there (it currently receives the model but does not import tool helpers).
- **Data/Privacy**: user data leaves the device only toward the user's own LLM provider, and only the summaries needed to answer; API keys continue to be sent directly to providers (existing disclosure). Health data entering prompts is a new disclosure category.
- **No breaking changes**: all schema changes are additive (Dexie v20); `@kaiord/ai` gains a new export without touching `createTextToWorkout`.
- **CI/CD**: no new package; no workflow changes required.
