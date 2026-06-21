## 1. Domain types

- [x] 1.1 Add `chat-conversation-record.ts` (`ChatConversationRecord`: `id`, `profileId`, `title`, `createdAt`, `updatedAt`, optional `providerId`/`modelId`) with the doc comment explaining the mutable `updatedAt` LWW clock
- [x] 1.2 Add `conversationId: string` to `ChatMessageRecord` and update its doc comment (FK into `chatConversations`)
- [x] 1.3 Add a pure `derive-conversation-title.ts` helper (trim + truncate to 60 chars + ellipsis) with unit tests

## 2. Persistence schema & migration (Dexie v24)

- [x] 2.1 Add `SCHEMAS.v24`: `chatConversations: "id, profileId, [profileId+updatedAt]"` and extend `chatMessages` with `conversationId` + `[profileId+conversationId+createdAt]` (retain `[profileId+createdAt]`)
- [x] 2.2 Add `registerV24` with an `upgrade` that, per profile with messages, seeds one `"Conversation 1"` row (`createdAt`/`updatedAt` = newest message `createdAt`) and backfills `conversationId` on every message
- [x] 2.3 Add v24 upgrade test: message-count parity, every message gets a `conversationId`, exactly one conversation per non-empty profile, empty profiles get none
- [x] 2.4 Update `dexie-schemas.test.ts` for the new store/index

## 3. Ports & repositories

- [x] 3.1 Add `ChatConversationRepository` port (put, listByProfile ordered by `updatedAt` desc, rename, touch, deleteOne, deleteByProfile)
- [x] 3.2 Extend `ChatMessageRepository` port with `listByConversation(profileId, conversationId, limit?)` and `deleteByConversation(conversationId)`; keep `deleteByProfile`
- [x] 3.3 Implement `dexie-chat-conversation-repository.ts` + tests
- [x] 3.4 Implement `listByConversation`/`deleteByConversation` in `dexie-chat-message-repository.ts` + tests
- [x] 3.5 Add in-memory `chatConversations` repository + extend the in-memory chat-message repository, with tests
- [x] 3.6 Wire `chatConversations` into the persistence port and the in-memory persistence snapshot test util

## 4. Cross-device sync

- [x] 4.1 Register `chatConversations` in the Dexie snapshot export/import surface and the tombstone surface (no change to `merge-record-key.ts`/`merge-snapshots.ts` — `id` PK + `updatedAt` clock are already correct)
- [x] 4.2 Update `dexie-snapshot-port.test.ts` to assert `chatConversations` is exported
- [x] 4.3 Add chat-conversation sync tests: rename converges by `updatedAt` LWW; delete survives a stale remote snapshot (conversation + message tombstones); profile cascade removes conversations

## 5. Application use cases

- [x] 5.1 Add the first-message persist path: in one transaction create the `chatConversations` row (auto-title, equal `createdAt`/`updatedAt`, draft model override if any) and append the first message; no standalone "create empty conversation" use case + tests
- [x] 5.2 Add `renameConversation(port, profileId, conversationId, title)` — reject empty/whitespace, advance `updatedAt` + tests
- [x] 5.3 Add `deleteConversation(port, profileId, conversationId)` — single transaction: delete messages, delete conversation row, write `[chatConversations+id]` + per-message tombstones + tests
- [x] 5.4 Add `setConversationModel(port, profileId, conversationId, providerId, modelId)` — write override, advance `updatedAt` + tests; add a model resolver that prefers the conversation override over `resolveModelForPurpose('chat')`
- [x] 5.5 Remove `clearConversation`; ensure each appended message touches its conversation's `updatedAt`

## 6. Hooks & routing

- [x] 6.1 Add `useChatConversationsLive(profileId)` (live query, `updatedAt` desc) + test
- [x] 6.2 Refactor `useChatMessagesLive` to read the active conversation (`profileId`, `conversationId`) + update tests
- [x] 6.3 Register the `/chat/:conversationId` route in `AppRoutes.tsx`; resolve the active conversation from the param with a guarded fallback to the list for unknown/foreign ids
- [x] 6.4 Hold the new-conversation draft (active id + pending model) in component/React state (ephemeral UI per the state rules); "New conversation" is idempotent on an empty draft

## 7. UI surface

- [x] 7.1 Add the conversation-list component (select active, "New conversation", per-item rename and delete) reading `useChatConversationsLive`
- [x] 7.2 Update `ChatPage`/`ChatConversation` to render list + active thread; remove the delete-all "Clear conversation" control in favour of per-conversation delete + new
- [x] 7.3 Wire rename UI (inline edit) and delete confirmation; keep composer/turn behaviour intact
- [x] 7.4 Wire the `ModelSelector` to the active conversation: persisted conversation writes the override; draft holds it in state until first message
- [x] 7.5 Component tests: list renders newest-active first, switch/deep-link selects a thread, delete falls back correctly, empty-profile starting state, model override is per-conversation, "New" is idempotent on an empty draft

## 8. Quality gates

- [x] 8.1 `pnpm -r test && pnpm -r build && pnpm lint:fix` clean (zero warnings/errors)
- [x] 8.2 `pnpm test:scripts` green (no Zustand write-through regressions)
- [x] 8.3 Coverage ≥ 70% for the SPA package on the new/changed modules
- [x] 8.4 Add a changeset for `@kaiord/workout-spa-editor`
- [x] 8.5 `pnpm lint:specs` and `/opsx:verify` against the spec scenarios
