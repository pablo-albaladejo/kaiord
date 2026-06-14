# Design — SPA AI Chat Assistant

## Context

The SPA already has every ingredient the chatbot needs, just not wired together:

- **Credentials/provider**: `aiProviders` Dexie table stores `LlmProviderConfig` (`src/store/ai-store-types.ts`); `createLanguageModel()` (`src/lib/provider-factory.ts`) turns a config into a Vercel AI SDK `LanguageModel` (`@ai-sdk/anthropic|openai|google`, browser-direct).
- **LLM orchestration**: `@kaiord/ai` already depends on `ai` v6 (peer) and calls `generateText` (`src/adapters/execute-with-retry.ts`); `createTextToWorkout` is the existing strategy-injected entry point.
- **Data**: Dexie v19 holds profile-scoped `workouts`, `coachingActivities`, `sessionMatches`, and six `health*` stores, all behind `PersistencePort` repositories (`src/ports/persistence-port.ts`).
- **Actions**: Train2Go sync is a use case behind `CoachingSource.sync()` (`src/adapters/train2go/use-train2go-source.ts`); manual health entry is `application/health/save-manual-health-metric.use-case.ts`; workout persistence use cases exist for the create flow.

Constraints: client-only (no backend), SPA-internal hexagonal layering (`types → ports → adapters → application → hooks → components`), 100-line files / 40-line functions, one `useLiveQuery` per page, no Zustand→Dexie write-through, mechanical guards (PII in toasts/console, test conventions).

## Goals / Non-Goals

**Goals:**

- Conversational Q&A over the user's own profile-scoped history, computed client-side, with only compact summaries sent to the LLM.
- Three v1 actions via tool-calling: trigger Train2Go sync, create a workout from text, log a manual health metric — every action explicitly confirmed by the user in-chat before execution.
- Reuse: existing provider configs and factory, existing use cases, existing `usage` accounting, existing prompt-injection defense pattern.
- Persisted rolling transcript per profile (survives refresh, cleared on demand, cascade-deleted with the profile).

**Non-Goals:**

- Multi-thread/conversation management (v1 = one rolling conversation per profile).
- Cross-session semantic memory, embeddings, or RAG indexes.
- Editing/deleting existing workouts, Garmin push, or arbitrary table writes via chat.
- Proactive/scheduled assistant behavior; voice input.
- Token-level cost preflight per message (monthly usage accounting only, as in generation).

## Decisions

### D1 — Chat engine lives in `@kaiord/ai` (application layer), tools are injected strategies

`@kaiord/ai` gains `createChatAgent({ model, tools, system?, maxSteps?, logger? })`, mirroring `createTextToWorkout`: the consumer supplies the `LanguageModel`; the package owns the multi-step tool-calling loop on top of the AI SDK. The tool contract (name, description, zod input schema, `execute`, `requiresConfirmation`) is defined as a type in `@kaiord/ai` — the port is specified in the package; the SPA implements adapters against it.

- _Alternative — engine inside the SPA `lib/`_: rejected; `@kaiord/ai` is the designated AI integration package, already carries the `ai` peer dependency, and an engine there is testable against mock models and reusable (CLI/MCP later).
- _Alternative — raw AI SDK calls from React hooks_: rejected; violates the SPA layering (components/hooks must not orchestrate I/O) and scatters retry/step logic.

No new dependencies anywhere: `ai` v6 is already a peer dep of `@kaiord/ai` and a direct dep of the SPA.

### D2 — Human-in-the-loop confirmation via the AI SDK "no-execute" pattern

Read tools carry an `execute` function and run automatically inside the loop. Action tools are declared without engine-side execution: when the model calls one, the engine **pauses the turn** and returns a `pendingAction` (tool name + validated input + human-readable summary). The UI renders an inline confirmation card; on approve, the SPA runs the matching use case and the engine resumes the loop with the tool result; on deny, the engine resumes with a "user declined" tool result so the model can respond gracefully. This is the AI SDK's documented HITL shape (tool call surfaces in `toolCalls`, app appends the tool result message).

- _Alternative — execute actions directly and offer undo_: rejected; sync and LLM-generation side effects are not cleanly undoable, and silent writes from a model violate least surprise.

### D3 — Turn result is streamed text; tool execution is step-bounded

The engine uses `streamText` with the tool set and a step cap (default 8) per user turn; assistant text deltas stream to the UI, tool calls/results surface as compact timeline events. Streaming matters for chat-perceived latency and is near-free with the AI SDK; tests use the SDK's mock model utilities.

### D4 — Read tools return bounded, summarized data (data minimization)

Read tools are implemented in `application/chat/tools/` over `PersistencePort` repositories with explicit zod-validated inputs (`dateFrom`, `dateTo`, `metric`, `limit`). Hard caps: date ranges clamped (default 90 days, max 366), result payloads truncated to a fixed row budget with aggregates (count/min/max/avg, top-N by the asked dimension) computed client-side. The full database is never serialized into a prompt. v1 read tools:

- `query_workouts` (range, sport filter → summaries: date, sport, name, duration, distance, state)
- `query_health` (range, metric ∈ six stores → daily values)
- `query_coaching` (range → coaching activities + match/compliance summary)
- `get_today` (resolves "today"/current week in the user's locale — the model never guesses dates)

### D5 — Action tools wrap existing use cases 1:1

- `sync_coaching` → the same use case behind `CoachingSource.sync()` for Train2Go (extension present/connected errors surface as tool results).
- `create_workout` → `createTextToWorkout` (existing pipeline incl. sanity checks) + the existing workout persistence use case; the confirmation card shows the parsed description and target date before anything is generated or written.
- `log_health_metric` → `save-manual-health-metric.use-case.ts` (sleep duration, weight, etc. — exactly the metrics the manual wellness form already accepts).

No new write paths are introduced; the chat is a new caller of audited use cases, so the existing mechanical guards keep applying.

### D6 — Transcript persistence: `chatMessages` store, Dexie v20 (additive)

New table `chatMessages: "id, profileId, [profileId+createdAt]"`. Record: `{ id, profileId, role: "user" | "assistant" | "tool", content, toolName?, createdAt, usage? }` with `createdAt` as an ISO-8601 string (matches the snapshot merge clock `recordClock`, unlike `aiProviders`' epoch-ms field; ISO strings also sort chronologically in the Dexie index). One rolling conversation per profile; "Clear conversation" deletes by `profileId`; the indexed `profileId` makes the table an automatic per-profile cascade-delete target (matching the existing `isPerProfileTable` discovery). New `ChatMessageRepository` on `PersistencePort` plus an in-memory test double. Read side is a single `useLiveQuery` hook (`use-chat-messages-live`). Only the last N (default 20) messages are replayed into the model context per turn; the system prompt is never persisted.

The transcript participates in cross-device cloud sync with no merge-layer changes: `exportTables()` already enumerates `db.tables`, so `chatMessages` is dumped automatically, and `mergeSnapshots` unions by `id` (default `recordKey`) keeping the newest by `recordClock` (`createdAt`) — trivially convergent because rows are append-only and immutable. Delete propagation follows the established convention exactly:

- **Clear-conversation** keeps the profile but removes its messages, so it MUST tombstone: the use case lists the profile's message ids, deletes them, and writes one `[chatMessages+id]` tombstone each — all inside one `port.transaction`. This is bulk-by-profile, so it cannot reuse the `withTombstones` `delete(id)` decorator; the tombstoning lives in the use case.
- **Profile-cascade delete** is NOT tombstoned, identical to `workouts`/`health*`/`sessionMatch`: the cascade removes the profile's data on each device independently and propagates via the existing `profiles` tombstone. `chatMessages` is wired into `deleteProfileWithCascade` via a `deleteByProfile` method, and `isPerProfileTable` (it carries `profileId` + `[profileId+createdAt]`) makes the cascade-fan-out test require that wiring.

### D7 — Surface: routed page `/chat`

Chat is a content destination (deep-linkable, meaningful internal state) → routed page per the spa-routing surface classification, with `[data-route-heading]` focus, "Chat page" announcement, lazy-loaded page component, and a navigation entry. No header modal, no dual-mount.

- _Alternative — floating drawer over every route_: rejected; conflicts with the surface-classification invariant and the mobile redesign's one-surface-per-URL model.

### D8 — Provider selection and empty state reuse generation patterns

The chat header reuses the existing model-selector pattern: defaults to the `isDefault` provider, switchable per conversation. With zero providers configured, the page renders the existing "no providers" empty state linking to Settings (same as `CreateProvidersEmpty`). API keys never appear in transcript records, analytics, toasts, or console output (R-PIIInterpolation already enforces the latter two).

### D9 — Prompt-injection defense and PII hygiene

The system prompt declares tool results as untrusted data; tool implementations fence externally-originated free text (coach descriptions, imported notes) with the same delimiter convention as the spa-ai-batch defense, and cap per-field length. Chat content is never logged or sent to analytics; analytics get count-only events (`chat-message-sent`, `chat-tool-confirmed`), consistent with the PII guard.

### D10 — Usage accounting reuses the monthly `usage` row

Each completed turn records prompt/completion token counts (reported by the AI SDK) into the existing `usage` table keyed by `yearMonth`, with the chat attributed the same way generation is today (additive field if a per-feature split is needed; no schema rewrite).

## Risks / Trade-offs

- [Model answers from stale partial context (e.g. asks 20 days but tool clamps to 90-day cap differently)] → tool results carry explicit `range_used` metadata the model must echo; scenarios pin this.
- [Tool loop runaway (model keeps calling tools)] → hard `maxSteps` cap per turn; the engine terminates with a best-effort answer and a visible "step limit reached" event.
- [Large histories blow token budgets] → row budgets + aggregates in tool results; last-20-message context window; no full-table serialization.
- [Prompt injection via coach descriptions or workout names] → fenced untrusted data + system-prompt rule + action tools always confirmation-gated, so even a successful injection cannot write without the user clicking approve.
- [Browser CORS limits for a provider] → unchanged from generation: Anthropic uses the dangerous-direct-browser-access header today; chat inherits exactly the same provider matrix and failure modes (surfaced as in-chat error states).
- [Synced transcript grows snapshot size unboundedly with chat usage] → rows are compact (text + metadata, no embeddings); "Clear conversation" is the user-facing control and propagates via tombstones; if real-world snapshots grow problematic, add a retention cap (oldest-message pruning writes tombstones, so it propagates like a clear) as a follow-up without schema changes.
- [Clear-conversation deletes many rows at once, so each must tombstone] → the clear use case runs delete + tombstone writes in one port transaction, mirroring the existing multi-write rollback contract; a partial failure rolls back both.
- [Streaming complicates tests] → engine consumed via a thin interface; unit tests use AI SDK mock models; component tests assert on final states, not deltas.

## Migration Plan

Purely additive: Dexie v19 → v20 adds one store (no data transform); `@kaiord/ai` adds a new export (no change to `createTextToWorkout`); no public-API breaking changes, no workflow changes. Rollback = not mounting the route; the unused table is inert.

## Open Questions

- Whether the usage panel should display chat usage as a separate line item or merged into the monthly totals (UI-only decision; accounting is identical either way).
- Exact navigation placement of the Chat entry (primary nav vs. header action) — to be settled with the mobile redesign's nav structure during implementation.
