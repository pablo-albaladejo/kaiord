> Completed: 2026-06-21

## Why

The in-SPA AI chat at `/chat` persists exactly one rolling transcript per profile (`spa-ai-chat` → "Transcript persistence"). A user cannot keep separate threads for separate topics, revisit a past exchange, or start fresh without destroying history — the only reset is "Clear conversation", which deletes everything. Bringing the chat to parity with familiar assistants (ChatGPT/Claude) requires a first-class conversation entity and a list to manage it.

## What Changes

- **Introduce a conversation entity.** A new Dexie store `chatConversations` (`id, profileId, title, createdAt, updatedAt`, plus optional `providerId`/`modelId` for the per-conversation model) becomes the parent of chat messages. Each `chatMessages` row gains a `conversationId` foreign key and a new compound index `[profileId+conversationId+createdAt]`.
- **Full conversation management.** Users can start a new conversation, switch between conversations from a list (ordered by most-recently-updated), rename a conversation, and delete a single conversation (its messages + the conversation row) without touching the others.
- **New conversation is a draft until first message.** "New conversation" opens an empty in-memory draft; the `chatConversations` row is persisted only when the user sends the first message. Invoking "New conversation" while already on an empty draft is a no-op, so titleless empty rows never accumulate.
- **Per-conversation model.** Each conversation remembers its own provider/model (`providerId`/`modelId`); when unset it falls back to the existing `resolveModelForPurpose('chat')` resolution, so migrated conversations behave exactly as today.
- **Auto-generated, editable titles.** A new conversation's title is derived from the user's first message (trimmed, ~80 chars, CSS-truncated in the list); the user can rename it at any time.
- **Routing.** `/chat` renders the conversation list plus the active thread; `/chat/:conversationId` deep-links a specific conversation. Both remain routed pages per `spa-routing` (heading focus, single live announcement, lazy-loaded).
- **BREAKING (internal SPA contract):** "Clear conversation" (delete-all-for-profile) is replaced by **delete-one-conversation** + **new-conversation**. The `clearConversation` use case and the `ChatMessageRepository.deleteByProfile` read path used by it change shape; the bulk profile-delete cascade is preserved.
- **Migration v23→v24.** On upgrade, all existing `chatMessages` for each profile are grouped into a single seeded conversation ("Conversation 1") so no history is lost; `conversationId` is backfilled on every existing message.
- **Cross-device sync.** `chatConversations` is registered in the snapshot/`recordClock` pipeline like `chatMessages` was at v21. Because conversations are mutable (rename), their merge uses `updatedAt` for last-write-wins; deletes propagate via `[chatConversations+id]` tombstones (plus the existing per-message tombstones for the conversation's messages).

## Capabilities

### New Capabilities

- `spa-chat-conversations`: The conversation manager — the `chatConversations` store and its repository port, the create/rename/delete/list use cases, title auto-generation, the conversation-list UI surface, and the cross-device merge rules (mutable `updatedAt` LWW + tombstones) for conversation rows.

### Modified Capabilities

- `spa-ai-chat`: "Transcript persistence" changes from one-transcript-per-profile to per-conversation transcripts; messages carry `conversationId`; the chat page renders the **active** conversation rather than the whole profile transcript; "Clear conversation" is replaced by delete-one + new-conversation.
- `spa-routing`: Adds the `/chat/:conversationId` deep-linkable route and re-classifies the `/chat` surface as a conversation list + active thread (heading/announcement/lazy-load invariants unchanged).
- `spa-persistence-port`: Adds the `ChatConversationRepository` port and extends `ChatMessageRepository` with a per-conversation read (`listByConversation`) and per-conversation delete; the `chatConversations` table joins the snapshot/tombstone surface.

## Impact

- **Package:** `@kaiord/workout-spa-editor` only (private SPA). No public `@kaiord/*` API change, no format-adapter change.
- **Hexagonal layers:** domain types (`chat-conversation-record.ts`, `conversationId` on `ChatMessageRecord`); ports (`ChatConversationRepository`, extended `ChatMessageRepository`); adapters (`dexie-chat-conversation-repository.ts` + in-memory equivalent, Dexie v24 schema + upgrade); application (`createConversation`, `renameConversation`, `deleteConversation`, reshaped `clearConversation`); UI (conversation list, routing, live-query hooks).
- **Persistence:** Dexie v24 — new store + new compound index on `chatMessages` + data migration. Snapshot/sync (`dexie-snapshot-port`, `recordClock`, tombstones) extended to cover `chatConversations`.
- **No new publishable package**, so no `.changeset/config.json` / workflow / `create-github-releases.js` updates needed; a changeset entry for the SPA is still required at PR time.
- **Mechanical guards:** the "one `useLiveQuery` per page" pattern is affected — the list and the active thread are two reads; `design.md` must justify the resolution. `check-no-zustand-writethrough` continues to apply (Dexie stays the persistence path).
