# Tasks — add-spa-ai-chatbot

## 1. Chat engine in `@kaiord/ai`

- [x] 1.1 Define the chat tool contract types (`ChatTool` with name, description, zod input schema, optional `execute`, `requiresConfirmation`; `ChatMessage`; turn-event union including text delta, tool call, tool result, pending action, step-limit) in `packages/ai/src/types.ts` (or a co-located `chat-types.ts`), tests first for the type guards/helpers that carry runtime logic
- [x] 1.2 TDD `createChatAgent({ model, tools, system?, maxSteps?, logger? })`: red tests with AI SDK mock models for (a) plain text turn, (b) read-tool round trip within one turn, (c) zod validation failure returned to the model as tool result, (d) step cap emits step-limit event and stops
- [x] 1.3 TDD the human-in-the-loop pause/resume path: action tool call pauses the turn and yields `pendingAction`; resume with approval result or "user declined" continues the same turn
- [x] 1.4 Export the new factory + types from `packages/ai/src/index.ts`; keep `createTextToWorkout` untouched; verify package builds and stays within file/function line caps

## 2. Transcript persistence (port → adapters)

- [ ] 2.1 Define `ChatMessageRepository` port (`append`, `listByProfile(profileId, limit?)`, `clear(profileId)`) and the `ChatMessageRecord` type; wire it into `PersistencePort` (tests for type-level contract via in-memory impl)
- [ ] 2.2 TDD `InMemoryChatMessageRepository` in `src/test-utils/` (profile scoping, chronological order, clear semantics)
- [ ] 2.3 Add Dexie v20 (`chatMessages: "id, profileId, [profileId+createdAt]"`) in `dexie-schemas.ts` + `register-kaiord-versions-v10-plus.ts`; tests: fresh install at v20, v19→v20 upgrade preserves rows, schema-inventory test updated
- [ ] 2.4 TDD `DexieChatMessageRepository` and register it on the Dexie persistence adapter; verify per-profile cascade delete picks up the table (existing `isPerProfileTable` discovery test extended)
- [ ] 2.5 Include `chatMessages` in the cloud-sync snapshot export; tests: exported snapshot contains the rows, two-device merge unions messages by `id`, and `recordClock` reads the ISO-8601 `createdAt`
- [ ] 2.6 TDD delete-propagation for the transcript: clear-conversation and profile-cascade deletes write per-row tombstones inside one port transaction; merge test proves cleared messages do not resurrect from a stale snapshot

## 3. Chat tools (SPA application layer)

- [ ] 3.1 TDD read tool `query_workouts` over `WorkoutRepository` (zod input with date range + optional sport, range clamping, row budget + aggregates, `range_used` metadata, profile isolation)
- [ ] 3.2 TDD read tool `query_health` over the health repositories (metric enum across the six stores, same bounding/`range_used` rules)
- [ ] 3.3 TDD read tool `query_coaching` over coaching + session-match repositories (activities summary, match/compliance rollup, fenced untrusted description text with per-field length cap)
- [ ] 3.4 TDD `get_today` date/week resolution tool (client clock, locale week id via existing `week-utils`)
- [ ] 3.5 TDD action tool `sync_coaching` wrapping the existing Train2Go sync use case (success, extension-not-connected error surfaced as tool result)
- [ ] 3.6 TDD action tool `create_workout` wrapping `createTextToWorkout` + the existing workout persistence use case (confirmation payload contains description + target date; sanity-check failure surfaces as tool result)
- [ ] 3.7 TDD action tool `log_health_metric` wrapping `save-manual-health-metric.use-case.ts` (sleep duration happy path; metric/payload validation rejections)
- [ ] 3.8 TDD `application/chat/` transcript use cases: append turn messages, list window (last N for model context), clear conversation; usage accounting per completed turn into the existing `usage` row
- [ ] 3.9 Author the chat system prompt (untrusted-data rule, tool usage guidance, locale/date guidance) as a versioned prompt module; injection test: fenced coach-description instruction does not bypass confirmation

## 4. Chat UI

- [ ] 4.1 Add `/chat` route in `AppRoutes.tsx` (lazy `ChatPage`, `RouteErrorBoundary`, `[data-route-heading]`, "Chat page" announcer label) + route tests; add navigation entry
- [ ] 4.2 TDD `use-chat-messages-live` hook (single `useLiveQuery` for the active profile transcript)
- [ ] 4.3 TDD `use-chat-turn` hook orchestrating: provider selection → `createLanguageModel` → `createChatAgent` turn → streaming text into local state → persistence via application use cases (components never touch Dexie/AI SDK directly)
- [ ] 4.4 Build ChatPage organisms within line caps: message list (user/assistant/tool-event entries), composer, provider selector reusing the existing model-selector pattern, no-provider empty state reusing the `CreateProvidersEmpty` pattern
- [ ] 4.5 Build the pending-action confirmation card (human-readable tool input, approve/deny, deny resumes with declined result); component tests for both paths
- [ ] 4.6 In-conversation error entries with retry for provider/tool failures; count-only analytics events (`chat-message-sent`, `chat-tool-confirmed`); verify PII guard compliance (no message content in toasts/console)
- [ ] 4.7 "Clear conversation" action with confirm; test other profiles' transcripts remain

## 5. Privacy policy and docs

- [ ] 5.1 Update the privacy policy page content: chat data flow disclosure (workout/coaching/health summaries to configured provider, user-initiated only), chat transcripts in client-side storage disclosure, clear-conversation in retention guidance; bump "Last updated"
- [ ] 5.2 Extend `lint:privacy-policy` required-disclosure checks for the new chat disclosures
- [ ] 5.3 Update SPA AGENTS.md entries for the new `application/chat/`, ports, and page surfaces

## 6. Verification and release

- [ ] 6.1 `pnpm lint:specs` passes for the new/updated spec deltas
- [ ] 6.2 `pnpm -r test && pnpm -r build && pnpm lint:fix` green across packages (coverage thresholds: 80% core/ai, 70% SPA)
- [ ] 6.3 Manual smoke: configure a provider, ask a history question, approve a sync and a sleep log, create a workout from chat, reload and verify transcript, clear conversation
- [ ] 6.4 Add changeset (`@kaiord/ai` minor, `@kaiord/workout-spa-editor` minor)
