## 1. Normalization and tokenization (pure)

- [x] 1.1 Create `application/chat/normalize-search-text.ts`: `normalizeSearchText(s)` = NFD + strip `\p{Diacritic}` + lowercase; `tokenize(query)` = normalize → split on whitespace → drop 1-char tokens.
- [x] 1.2 Write `normalize-search-text.test.ts` (AAA, `should …`): accent stripping ("Úmbral"→"umbral"), case-folding, 1-char token discard, 2-char token kept (z4), whitespace-only/empty → no tokens.

## 2. Snippet builder (pure)

- [x] 2.1 Create `application/chat/build-snippet.ts`: given original text + match offsets, return a snippet anchored on the highest-ranked match with ±30 chars context, ellipsis only on truncated sides, plus highlight `ranges` over the original (accented) text.
- [x] 2.2 Write `build-snippet.test.ts`: long-both-sides truncation with ellipsis, short side without ellipsis, ranges align to the original (not normalized) string.

## 3. Search use case (pure)

- [x] 3.1 Create `application/chat/search-conversations.ts`: `searchConversations(query, conversations, messages) → SearchResult[]`. Conversation-level token-AND over title + messages; substring tokens; `SearchResult = { conversationId, title, titleMatch, messageMatches: { messageId, role, snippet, ranges }[] }`.
- [x] 3.2 Implement ranking: conversations by title-match boost + token frequency, tiebreak `updatedAt` desc; messageMatches ordered by distinct tokens matched desc.
- [x] 3.3 Empty/ineffective query (no tokens after discard) → returns `[]`.
- [x] 3.4 Write `search-conversations.test.ts`: tokens spread across messages match; missing token excludes; substring ("vo2"→"vo2max"); title-only match; title outranks content-only; higher frequency ranks higher; recency tiebreak; message with more tokens first; empty query → [].

## 4. Search hook (orchestration)

- [x] 4.1 Create `hooks/use-chat-search.ts`: debounce the query; when the effective query is non-empty, lazily load profile messages via `chatMessages.listByProfile(profileId)`; run `searchConversations`; expose `{ query, setQuery, results, isSearching }`.
- [x] 4.2 Write `use-chat-search.test.tsx`: no message read until query is effective; debounced search; results update on query change; clearing query returns to idle.

## 5. Results UI and focus wiring

- [x] 5.1 Add a search box above the conversation list (wired through `ChatWorkspace`/`ConversationList`), with a clear control.
- [x] 5.2 Create `components/organisms/Chat/ChatSearchResults.tsx`: render results grouped by conversation; each message result shows the snippet with static-yellow `<mark>`/`bg-yellow` highlight (no animation); selecting a result calls `onSelect(conversationId, focusMessageId)`.
- [x] 5.3 Replace `ConversationList` with `ChatSearchResults` while the effective query is non-empty; restore the list when cleared.
- [x] 5.4 Thread `focusMessageId` as transient nav state into `ChatConversation`/`ChatMessageList`; on focus, `scrollIntoView` the message and apply the same static-yellow highlight until the search changes; keep the URL `/chat/:conversationId` unchanged.
- [x] 5.5 Write UI tests (AAA, `should …`): results panel replaces list while searching; clearing restores list; selecting a result opens the conversation, scrolls to and highlights the message, and leaves the URL unchanged.

## 6. Quality gates

- [x] 6.1 Verify read-only: no writes/migration in search paths; reuse existing `listByProfile` (no new port, no schema bump).
- [x] 6.2 SPA build green (core rebuilt first); full SPA suite 5110/5111 (the one failure is the pre-existing `model-catalog-freshness` SDK-drift test, unrelated to chat search); ESLint `--max-warnings=0` clean across all new/changed files; caps (≤100 lines/file, ≤40/function) satisfied.
- [x] 6.3 `pnpm lint:specs` passes (51/51). Changeset N/A — `@kaiord/workout-spa-editor` is private and explicitly excluded from the changeset-bot PUBLISHABLE set.
