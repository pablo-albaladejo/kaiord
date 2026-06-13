# Tasks — add-spa-ai-chatbot

## 1. Chat engine in `@kaiord/ai`

- [x] 1.1 Define the chat tool contract types (`ChatTool` with name, description, zod input schema, optional `execute`, `requiresConfirmation`; `ChatMessage`; turn-event union including text delta, tool call, tool result, pending action, step-limit) in `packages/ai/src/types.ts` (or a co-located `chat-types.ts`), tests first for the type guards/helpers that carry runtime logic
- [x] 1.2 TDD `createChatAgent({ model, tools, system?, maxSteps?, logger? })`: red tests with AI SDK mock models for (a) plain text turn, (b) read-tool round trip within one turn, (c) zod validation failure returned to the model as tool result, (d) step cap emits step-limit event and stops
- [x] 1.3 TDD the human-in-the-loop pause/resume path: action tool call pauses the turn and yields `pendingAction`; resume with approval result or "user declined" continues the same turn
- [x] 1.4 Export the new factory + types from `packages/ai/src/index.ts`; keep `createTextToWorkout` untouched; verify package builds and stays within file/function line caps

## 2. Transcript persistence (port → adapters)

- [x] 2.1 Define `ChatMessageRepository` port (`append`, `listByProfile(profileId, limit?)`, `deleteByProfile`) and the `ChatMessageRecord` type; wire it into `PersistencePort` (clear is layered as a use case so tombstoning lives in the application layer)
- [x] 2.2 TDD `InMemoryChatMessageRepository` in `src/test-utils/` (profile scoping, chronological order, limit semantics, deleteByProfile)
- [x] 2.3 Add Dexie v20 (`chatMessages: "id, profileId, [profileId+createdAt]"`) in `dexie-schemas.ts` + `register-kaiord-versions-v10-plus.ts`; tests: fresh install at v20, v19→v20 upgrade preserves rows, schema-inventory test updated (extracted `backfillLinkedAccounts` to keep `dexie-schemas.ts` under the line cap)
- [x] 2.4 TDD `DexieChatMessageRepository` and register it on the Dexie persistence adapter; per-profile cascade delete picks up the table (cascade dep + `useProfileDelete` + `isPerProfileTable` fan-out integration test extended)
- [x] 2.5 Include `chatMessages` in the cloud-sync snapshot export (automatic via `exportTables` table enumeration); tests: exported snapshot contains the rows, two-device merge unions messages by `id`, and `recordClock` reads the ISO-8601 `createdAt`
- [x] 2.6 TDD delete-propagation for the transcript: clear-conversation writes per-message tombstones inside one port transaction (profile-cascade deletes follow the existing no-tombstone convention); merge test proves cleared messages do not resurrect from a stale snapshot

## 3. Chat tools (SPA application layer)

- [x] 3.1 TDD read tool `query_workouts` over `WorkoutRepository` (zod input with date range + optional sport, range clamping, row budget + aggregates incl. longest computed over all rows, `range_used` metadata, profile isolation via fetch-then-filter)
- [x] 3.2 TDD read tool `query_health` over the health repositories (metric enum across the six stores, same bounding/`range_used` rules)
- [x] 3.3 TDD read tool `query_coaching` (activities summary with status + completionPercent as the compliance signal, fenced untrusted title/description with per-field length cap; sessionMatch rollup deferred — status/completion already conveys planned-vs-done)
- [x] 3.4 TDD `get_today` date/week resolution tool (injected `today`, ISO week id via existing `week-utils`)
- [x] 3.5 action tool `sync_coaching` factory (requiresConfirmation; execute delegates to an injected op — the Train2Go use case + extension-not-connected error wiring lands in the group-4 hook)
- [x] 3.6 action tool `create_workout` factory (confirmation payload carries description + target date + sport; `createTextToWorkout` + persistence wiring lands in the group-4 hook)
- [x] 3.7 action tool `log_health_metric` factory (metric/day/value schema with metric-enum rejection; `saveManualHealthMetric` wiring lands in the group-4 hook)
- [x] 3.8 transcript use cases: `clearConversation` (group 2) + windowed `listByProfile` (group 2) + `append-turn-messages` (user/assistant/tool) + `recordChatUsage` per-turn into the `usage` row, all wired through `use-chat-turn` (group 4b)
- [x] 3.9 Author the chat system prompt (untrusted-data fence rule, tool usage guidance, relative-date guidance) as a versioned module; injection test: fenced coach-description instruction stays data (`query_coaching` fences it; action tools remain confirmation-gated)

## 4. Chat UI

- [x] 4.1 Add `/chat` route in `AppRoutes.tsx` (lazy `ChatPage`, `RouteErrorBoundary`, `[data-route-heading]`, "Chat page" announcer label) + route tests done; **nav entry pending** (deferred placement — bottom-nav FAB-notch layout is tuned; wire in 4b)
- [x] 4.2 TDD `use-chat-messages-live` hook (single `useLiveQuery` for the active profile transcript; chronological + re-fire-on-append test)
- [x] 4.3 `use-chat-turn` hook orchestrating provider → `createLanguageModel` → `createChatAgent` → streamed turn → persistence + pending-action confirm/deny resume. Logic extracted to testable `chat-turn-runner`/`chat-turn-context` functions (unit-tested with a mocked agent); Train2Go sync op uses the transport + `syncWeek` directly (not `useTrain2GoSource`)
- [x] 4.4 ChatPage organisms: ChatMessageList + ChatComposer + provider selector (`ModelSelector`) + no-provider empty state (`CreateProvidersEmpty`) + `chat-message-mapper`
- [x] 4.5 Pending-action confirmation card (humanized tool label + validated input, Approve/Decline; deny resumes with a declined result, approve runs the tool then resumes) — approve/deny paths covered by the runner unit test
- [~] 4.6 In-conversation error entries with retry for provider/tool failures done (fixed-category `ChatErrorNotice`, no message content — PII-safe); **count-only analytics events (`chat-message-sent`, `chat-tool-confirmed`) still pending**
- [x] 4.7 "Clear conversation" two-step confirm wired to the group-2 `clearConversation` use case
- [ ] 4.8 Nav entry for `/chat` (deferred placement — bottom-nav is a tuned 4-tab + FAB-notch layout; decide header vs. tab with the redesign, then one-line wire + classification test)

## 5. Privacy policy and docs

- [ ] 5.1 Update the privacy policy page content: chat data flow disclosure (workout/coaching/health summaries to configured provider, user-initiated only), chat transcripts in client-side storage disclosure, clear-conversation in retention guidance; bump "Last updated"
- [ ] 5.2 Extend `lint:privacy-policy` required-disclosure checks for the new chat disclosures
- [ ] 5.3 Update SPA AGENTS.md entries for the new `application/chat/`, ports, and page surfaces

## 6. Verification and release

- [ ] 6.1 `pnpm lint:specs` passes for the new/updated spec deltas
- [ ] 6.2 `pnpm -r test && pnpm -r build && pnpm lint:fix` green across packages (coverage thresholds: 80% core/ai, 70% SPA)
- [ ] 6.3 Manual smoke: configure a provider, ask a history question, approve a sync and a sleep log, create a workout from chat, reload and verify transcript, clear conversation
- [ ] 6.4 Add changeset (`@kaiord/ai` minor, `@kaiord/workout-spa-editor` minor)
