## 1. Domain types

- [ ] 1.1 Add `chat-conversation-record.ts` (`ChatConversationRecord`: `id`, `profileId`, `title`, `createdAt`, `updatedAt`) with the doc comment explaining the mutable `updatedAt` LWW clock
- [ ] 1.2 Add `conversationId: string` to `ChatMessageRecord` and update its doc comment (FK into `chatConversations`)
- [ ] 1.3 Add a pure `derive-conversation-title.ts` helper (trim + truncate to 60 chars + ellipsis) with unit tests

## 2. Persistence schema & migration (Dexie v24)

- [ ] 2.1 Add `SCHEMAS.v24`: `chatConversations: "id, profileId, [profileId+updatedAt]"` and extend `chatMessages` with `conversationId` + `[profileId+conversationId+createdAt]` (retain `[profileId+createdAt]`)
- [ ] 2.2 Add `registerV24` with an `upgrade` that, per profile with messages, seeds one `"Conversation 1"` row (`createdAt`/`updatedAt` = newest message `createdAt`) and backfills `conversationId` on every message
- [ ] 2.3 Add v24 upgrade test: message-count parity, every message gets a `conversationId`, exactly one conversation per non-empty profile, empty profiles get none
- [ ] 2.4 Update `dexie-schemas.test.ts` for the new store/index

## 3. Ports & repositories

- [ ] 3.1 Add `ChatConversationRepository` port (put, listByProfile ordered by `updatedAt` desc, rename, touch, deleteOne, deleteByProfile)
- [ ] 3.2 Extend `ChatMessageRepository` port with `listByConversation(profileId, conversationId, limit?)` and `deleteByConversation(conversationId)`; keep `deleteByProfile`
- [ ] 3.3 Implement `dexie-chat-conversation-repository.ts` + tests
- [ ] 3.4 Implement `listByConversation`/`deleteByConversation` in `dexie-chat-message-repository.ts` + tests
- [ ] 3.5 Add in-memory `chatConversations` repository + extend the in-memory chat-message repository, with tests
- [ ] 3.6 Wire `chatConversations` into the persistence port and the in-memory persistence snapshot test util

## 4. Cross-device sync

- [ ] 4.1 Register `chatConversations` in the Dexie snapshot export/import surface and the tombstone surface (no change to `merge-record-key.ts`/`merge-snapshots.ts` — `id` PK + `updatedAt` clock are already correct)
- [ ] 4.2 Update `dexie-snapshot-port.test.ts` to assert `chatConversations` is exported
- [ ] 4.3 Add chat-conversation sync tests: rename converges by `updatedAt` LWW; delete survives a stale remote snapshot (conversation + message tombstones); profile cascade removes conversations

## 5. Application use cases

- [ ] 5.1 Add `createConversation(port, profileId)` (returns the new conversation, equal `createdAt`/`updatedAt`) + tests
- [ ] 5.2 Add `renameConversation(port, profileId, conversationId, title)` — reject empty/whitespace, advance `updatedAt` + tests
- [ ] 5.3 Add `deleteConversation(port, profileId, conversationId)` — single transaction: delete messages, delete conversation row, write `[chatConversations+id]` + per-message tombstones + tests
- [ ] 5.4 Replace `clearConversation` usages; ensure auto-title sets the conversation title on the first persisted user message (advancing `updatedAt`)
- [ ] 5.5 Ensure each appended message touches its conversation's `updatedAt`

## 6. Hooks & routing

- [ ] 6.1 Add `useChatConversationsLive(profileId)` (live query, `updatedAt` desc) + test
- [ ] 6.2 Refactor `useChatMessagesLive` to read the active conversation (`profileId`, `conversationId`) + update tests
- [ ] 6.3 Register the `/chat/:conversationId` route in `AppRoutes.tsx`; resolve the active conversation from the param with a guarded fallback to the list for unknown/foreign ids

## 7. UI surface

- [ ] 7.1 Add the conversation-list component (select active, "New conversation", per-item rename and delete) reading `useChatConversationsLive`
- [ ] 7.2 Update `ChatPage`/`ChatConversation` to render list + active thread; remove the delete-all "Clear conversation" control in favour of per-conversation delete + new
- [ ] 7.3 Wire rename UI (inline edit) and delete confirmation; keep composer/turn behaviour intact
- [ ] 7.4 Component tests: list renders newest-active first, switch/deep-link selects a thread, delete falls back correctly, empty-profile starting state

## 8. Quality gates

- [ ] 8.1 `pnpm -r test && pnpm -r build && pnpm lint:fix` clean (zero warnings/errors)
- [ ] 8.2 `pnpm test:scripts` green (no Zustand write-through regressions)
- [ ] 8.3 Coverage ≥ 70% for the SPA package on the new/changed modules
- [ ] 8.4 Add a changeset for `@kaiord/workout-spa-editor`
- [ ] 8.5 `pnpm lint:specs` and `/opsx:verify` against the spec scenarios
