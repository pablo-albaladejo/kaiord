## Context

The in-SPA AI chat (`@kaiord/workout-spa-editor`) persists one rolling transcript per profile in the Dexie `chatMessages` store (`id, profileId, [profileId+createdAt]`, schema v21). `ChatPage` reads it with `useChatMessagesLive(profileId)`; `clearConversation` deletes every message for the profile and writes per-message `[chatMessages+id]` tombstones. Cross-device sync is a pure last-write-wins snapshot merge (`mergeSnapshots`): rows are keyed by primary key (default `id`) and compared via `recordClock`, which already reads `updatedAt` then falls back to `createdAt`. The DB is at v23; the next store is v24.

This change introduces a `chatConversations` entity so a profile can hold many threads, with a list to create/switch/rename/delete — without losing the existing transcript.

## Goals / Non-Goals

**Goals:**

- A first-class `chatConversations` store, parent of `chatMessages` via a `conversationId` FK.
- Full management: create, switch (incl. deep link), rename, delete-one — like ChatGPT/Claude.
- Auto-generated, editable titles.
- Lossless v23→v24 migration that buckets all prior messages into one seeded conversation.
- Conversation rows sync across devices with rename converging (LWW on `updatedAt`) and deletes propagating via tombstones.

**Non-Goals:**

- LLM-generated titles (titles derive from the first user message; manual edit only).
- Cross-profile or shared conversations; folders, tags, search, pinning, archiving.
- Changing the turn engine, tool-calling, provider resolution, or usage accounting.
- Any change to public `@kaiord/*` APIs or format adapters.

## Decisions

### D1 — Separate `chatConversations` store (not a `conversationId`-only column)

Conversations need mutable metadata (`title`, `updatedAt` for list ordering, and a per-conversation model override) that has no natural home on append-only message rows. A dedicated store gives a direct, indexable list query (`[profileId+updatedAt]`) and clean rename/touch semantics. The record is `{ id, profileId, title, createdAt, updatedAt, providerId?, modelId? }` — the optional `providerId`/`modelId` carry the per-conversation model (D9).
_Alternative considered:_ add `conversationId` to `chatMessages` only and derive the list by grouping. Rejected: deriving a title/`updatedAt` requires scanning messages, and rename has nowhere to live.

### D2 — Schema v24: new store + new compound index on messages

```
chatConversations: "id, profileId, [profileId+updatedAt]"
chatMessages:      "id, profileId, conversationId, [profileId+createdAt], [profileId+conversationId+createdAt]"
```

The legacy `[profileId+createdAt]` index is retained (the profile-delete cascade and any whole-profile read still work); the new `[profileId+conversationId+createdAt]` index serves the active-thread read. Dexie rebuilds indexes on upgrade.

### D9 — Per-conversation model override

The active model is resolved per conversation: a conversation's `providerId`/`modelId` override, falling back to `resolveModelForPurpose('chat')` when unset (so existing/migrated conversations behave exactly as today). Changing the model on a persisted conversation writes the override to its `chatConversations` row (advancing `updatedAt`, LWW-synced like rename). On a draft (D10) the selection lives in component state and is written when the conversation is first persisted.
_Alternative considered:_ a separate per-conversation `aiModelBindings`-style store. Rejected: the override is 1:1 with a conversation row, so it belongs on that row — no extra store, no extra sync surface.

### D10 — A new conversation is an in-memory draft until its first message

"New conversation" does not write a `chatConversations` row; it opens an empty draft held in component state (active conversation id = a sentinel/`null`). The row is created — together with the first message, in one transaction — only when the user sends. "New conversation" is therefore idempotent: invoking it while already on an empty draft is a no-op. Consequences: the list never shows titleless empty threads, deep-linking only resolves persisted ids, and the draft also holds the pending model selection (D9) until persistence.
_Alternative considered:_ persist an empty row on "New". Rejected: accumulates titleless rows that sync as noise (the OQ3 risk).

### D3 — Migration buckets prior messages into "Conversation 1"

The v24 `upgrade` runs per profile: for every profile that has `chatMessages`, create one `chatConversations` row (title `"Conversation 1"`, `createdAt`/`updatedAt` = the newest existing message's `createdAt` so it sorts sensibly) and set `conversationId` on each of that profile's messages to it. Profiles with no messages get no conversation (the empty state handles first-use). This is irreversible, so it gets a dedicated upgrade test asserting message count and FK assignment.
_Alternative considered:_ one conversation per message-day. Rejected as surprising and unnecessary.

### D4 — Sync reuses the generic merge unchanged

`recordClock` already prefers `updatedAt`, and `mergeSnapshots` keys by `id` (the default PK) — so registering `chatConversations` in the snapshot export and tombstone surface is sufficient for rename LWW and delete propagation. No change to `merge-record-key.ts` (no new `PRIMARY_KEYS` entry needed; `id` is correct) or `merge-snapshots.ts`. Only the snapshot port's table set and the export/import wiring grow.
_Trade-off:_ `updatedAt` advances on every message append (to keep list order fresh). That means an active conversation's row is rewritten frequently; acceptable — it is one small row per turn and LWW handles concurrent edits.

### D5 — Reshape `clearConversation` into per-conversation operations

Replace the delete-all use case with `deleteConversation(port, profileId, conversationId)`: in one `port.transaction`, delete the conversation's messages (new `deleteByConversation`), delete the conversation row, and write a `[chatConversations+id]` tombstone plus one `[chatMessages+id]` tombstone per deleted message. Add `renameConversation`. Because of the draft model (D10) there is no "create empty conversation" use case: the first-message path persists the conversation row and the message together in one transaction (carrying the auto-title from D8 and any draft model override from D9). The existing `deleteByProfile` bulk path stays for the profile-delete cascade (covered by the profile tombstone, no per-row tombstones needed there — unchanged).

### D6 — Routing: `/chat` (list + active) and `/chat/:conversationId` (deep link)

`/chat` selects the most-recently-updated conversation as active (or the empty state). `/chat/:conversationId` selects that conversation; an unknown/foreign id falls back to the list without leaking another profile's data. Both share the existing `/chat` surface classification (heading focus, single "Chat page" announcement, lazy load).
_Alternative considered:_ active conversation in Zustand/Dexie without a URL. Rejected: deep-linkability is the spa-routing norm and makes sharing/bookmarking work.

### D7 — Two live queries on the chat page

The list (`useChatConversationsLive(profileId)`) and the active thread (`useChatMessagesLive(profileId, conversationId)`, refactored to take a conversation) are two reads. The "one `useLiveQuery` per page" guideline is a single-page-of-data heuristic; here the list and the active thread are genuinely distinct datasets. We keep them as two hooks and document the rationale rather than forcing an artificial join. Writes stay Dexie-only (no Zustand write-through), so `check-no-zustand-writethrough` is unaffected.

### D8 — Title generation

When a draft is first persisted, set `title` to the first user message trimmed and truncated to ~80 chars (ellipsis if cut). The 80-char bound is what we store and what pre-fills rename; the conversation list truncates to one line visually with CSS (line-clamp), so the stored value stays useful while the UI stays tidy. Rename validates non-empty/non-whitespace and advances `updatedAt`. Title generation is a pure helper, unit-tested independently of the turn engine.

## Risks / Trade-offs

- **Irreversible migration** → Dedicated v24 upgrade test (message-count parity, every message gets a `conversationId`, exactly one conversation per non-empty profile). Manual smoke on a populated DB before release.
- **`updatedAt` churn on every turn** → One tiny row rewrite per turn; LWW merge already handles it. Acceptable; no batching needed.
- **Active-conversation selection ambiguity after delete** → Deterministic rule: after deleting the active conversation, fall back to the next most-recently-updated, else the empty state. Covered by a scenario.
- **Two live queries vs the one-query guideline** → Documented exception (D7); both are read-only Dexie queries, no store coupling.
- **Deep link to a foreign/deleted id** → Guarded fallback to the list; never renders another profile's conversation (scenario in spa-routing).
- **Snapshot test surface** → `dexie-snapshot-port` and the chat-sync tests must add `chatConversations`; the in-memory persistence snapshot test util (`chatConversations` map) grows alongside.

## Migration Plan

1. Add `chat-conversation-record.ts` and `conversationId` to `ChatMessageRecord` (optional during the migration window, required for new writes).
2. Register Dexie v24: new store, new compound index, `upgrade` per D3.
3. Add `ChatConversationRepository` (Dexie + in-memory) and extend `ChatMessageRepository` (`listByConversation`, `deleteByConversation`); wire into the persistence port and snapshot export/tombstone surface.
4. Add `createConversation` / `renameConversation` / `deleteConversation` use cases; remove the delete-all "Clear conversation" surface.
5. Refactor hooks (`useChatMessagesLive` → per conversation; new `useChatConversationsLive`) and `ChatPage`/`ChatConversation` to render list + active thread; add `/chat/:conversationId` route.
6. Title helper + auto-title on first message; rename UI.
7. Tests: upgrade migration, repositories, use cases, sync merge (rename converges, delete survives), routing fallback, title helper.

**Rollback:** v24 is additive at the schema level but the migration mutates existing message rows (`conversationId`). There is no in-place downgrade; rollback means shipping a revert that ignores `conversationId` and `chatConversations`. Pre-release smoke on a populated profile is the gate.

## Open Questions

- All resolved. Auto-title bound = ~80 chars stored, CSS-truncated in the list (D8). Model is per-conversation via `providerId`/`modelId` on the row, falling back to `resolveModelForPurpose('chat')` (D9). "New conversation" is an in-memory draft, persisted with its first message; idempotent on an already-empty draft (D10).
