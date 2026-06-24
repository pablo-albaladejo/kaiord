## Why

The in-SPA AI chat assistant now keeps distinct per-profile conversations
(see `spa-chat-conversations`), but the only way to find an earlier exchange is
to scroll the conversation list and read titles — which are auto-derived from the
first user message and rarely describe what was actually discussed. As the number
of threads grows, recalling "where did we talk about the VO2 block near threshold?"
becomes impractical. There is no way to search inside the chats.

## What Changes

- Add a word search over the active profile's chats that matches against both
  conversation **titles** and message **content** (user/assistant), entirely
  client-side and read-only — no Dexie migration, no new ports, no writes.
- Matching is accent- and case-insensitive (NFD diacritic stripping), tokenized
  on whitespace; tokens of a single character are ignored. A conversation matches
  when its title plus all its messages together contain **every** token (tokens may
  be spread across different messages). No fuzzy matching, no inverted index.
- Results are ranked: conversations by a relevance score (title-match boost +
  token frequency, with `updatedAt` as the tiebreak); within a conversation, the
  messages that match the most tokens surface first.
- Each result shows a snippet (±30 characters of context around the matched token,
  ellipsis on truncation) with the matched span highlighted in static yellow.
- Selecting a result opens the conversation and scrolls to the matched message,
  highlighting it with the same static yellow. The matched-message focus is
  transient navigation state — the deep-link URL stays `/chat/:conversationId`.
- The search box sits above the conversation list; while the query is non-empty the
  results panel replaces the conversation list (with a clear affordance). Profile
  messages are loaded lazily when search is active, debounced.

Out of scope for v1 (noted as future work, not built): fuzzy/typo tolerance, an
inverted index / BM25, a stopword list, and extracting a shared
`normalizeForSearch()` to also fix the accent-insensitive gap in the Workout
Library search (`filter-utils.ts`).

## Capabilities

### New Capabilities

- `spa-chat-search`: Client-side word search across a profile's chat
  conversations — normalization, token-AND match at the conversation level,
  conversation/message ranking, snippet generation with highlight, and the
  results UI with scroll-to-message focus.

### Modified Capabilities

<!-- None. spa-chat-conversations behavior is unchanged; search is read-only and additive. -->

## Impact

- **Package**: `@kaiord/workout-spa-editor` (private SPA) only. Hexagonal layer:
  `application` (pure search use case) + `hooks`/`components` (UI). No domain,
  no adapter, no port changes — reuses the existing
  `chatMessages.listByProfile(profileId)` read and `useChatConversationsLive`.
- **New files** (respecting the 100-line/file, 40-line/function caps):
  `application/chat/search-conversations.ts` (+ likely `normalize-search-text.ts`,
  `build-snippet.ts`), `hooks/use-chat-search.ts`,
  `components/organisms/Chat/ChatSearchResults.tsx` and a search box wired into
  `ChatWorkspace`/`ConversationList`; `ChatMessageList` gains a `focusMessageId`.
- **No** new dependencies, no schema/version bump, no public-API or
  cross-device-sync impact (read-only).
- **Tests**: unit tests for the search use case (accent normalization, 1-char
  token discard, conversation-level match with tokens spread across messages,
  conversation and message ranking, snippet truncation) plus UI tests, following
  the repo's `should …` title and AAA conventions; frontend coverage ≥ 70%.
