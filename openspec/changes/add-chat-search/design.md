## Context

The SPA chat assistant persists per-profile conversations (`chatConversations`)
and append-only messages (`chatMessages`) in Dexie, read reactively through
`useChatConversationsLive` and `useChatMessagesLive`. `ChatPage → ChatWorkspace`
renders a two-column layout: `ConversationList` (sidebar) and the active
`ChatConversation` thread. The message repository already exposes
`listByProfile(profileId)` with no limit, so all of a profile's message text is
reachable without any schema change.

There is no full-text index in Dexie and no search library anywhere in the
monorepo. The only existing in-app search — the Workout Library `filterBySearch`
— is naive `toLowerCase().includes()` over a single contiguous substring, with no
accent handling. Chat content is long-form prose, where that approach fails on
multi-word queries and accented Spanish ("intervalos vo2" vs "intervalos de VO2",
"umbral" vs "úmbral"). This change introduces a dedicated, dependency-free search
for chats, with the matching semantics already crystallized in exploration.

## Goals / Non-Goals

**Goals:**

- Find conversations by words in their title and message content, accent- and
  case-insensitively, for the active profile.
- Keep the feature read-only and additive: no Dexie migration, no new port, no
  effect on cross-device sync.
- Produce ranked results with highlighted snippets and scroll-to-message focus.
- Keep all logic in a pure, unit-testable use case; respect the 100-line/file and
  40-line/function caps.

**Non-Goals:**

- Fuzzy / typo-tolerant matching, edit-distance, or an inverted index / BM25.
- A stopword list or language-specific stemming.
- Extracting a shared `normalizeForSearch()` to also fix the Library search's
  accent gap (worthwhile, but out of scope here to keep the change focused).
- Searching across profiles or persisting search state.

## Decisions

### D1 — Dependency-free token-AND over normalized text (not a search library)

Match by: normalize (`NFD` + strip `\p{Diacritic}` + lowercase) → split on
whitespace → drop 1-char tokens → require every token as a substring. This is
~level 3 ("token-AND + light score") on the spectrum considered.

- **Why not naive substring (Library's approach):** fails multi-word and accents —
  the two things chat prose needs most.
- **Why not fuzzy (Fuse.js / Levenshtein):** over-engineered for a single-user
  personal app with low volume; in long prose, edit-distance fires many false
  positives and makes exact highlight ranges ambiguous.
- **Why not an inverted index (MiniSearch/FlexSearch):** adds a dependency and an
  index lifecycle (rebuild on append/merge) for volume the app does not have. The
  use case is the natural seam to drop one in later if ever needed.

### D2 — Conversation-level match, message-level ranking ("B with re-ranking")

A conversation matches when title + all messages together contain every token,
even if tokens are spread across different messages. This favors recall (the
mental model of "we discussed this somewhere in this thread"). Precision is
recovered in ordering, not exclusion: within a conversation, messages matching
more distinct tokens rank first, and conversations are scored by title-match
boost + token frequency with `updatedAt` as the tiebreak.

- **Alternative considered — AND per message:** only messages containing all tokens
  match. More precise per hit, but silently drops conversations where the terms
  live in separate messages — the common chat case. Rejected; its precision is
  preserved via message ranking instead.

### D3 — Substring tokens beat exact offsets out of fuzzy's reach

Because each token matches as a literal normalized substring, the exact character
offsets of every match are known. Snippet windowing (±30 chars around the
highest-ranked token's span) and the static-yellow highlight fall out directly,
with no separate highlight pass. Normalization is computed for matching but the
**original** text is sliced for display, so accents render correctly in snippets.

### D4 — Transient focus state, not a URL param

Scroll-to-message passes a `focusMessageId` as transient navigation state down to
`ChatMessageList`, which calls `scrollIntoView` and applies the same static
yellow until the search changes. The deep-link URL stays `/chat/:conversationId`
so shared links keep one meaning and history is not polluted by per-result focus.

- **Alternative — `?m=<messageId>` query param:** deep-linkable to a message, but
  complicates routing and history for a transient UI affordance. Rejected for v1.

### D5 — Live-while-active, debounced message read; results panel replaces the list

Profile messages for search are read via the existing `listByProfile`, but only
**while search is active** and through `useLiveQuery` — the repo's standard
posture for persisted data. When the query is idle the live query resolves to an
empty set, so no per-profile read runs until the user searches; once active, the
subscription reflects messages appended during the session and a profile switch
without a remount. Input is debounced before the search recomputes. While the
query is non-empty the results panel replaces `ConversationList` in the same
column (with a clear control); an empty query restores the list.

- **Why not a one-time snapshot load:** a single `listByProfile().then(setState)`
  on first activation is simpler, but freezes the searched set for the hook's
  lifetime — messages sent during the session are not searchable until remount,
  and a profile switch briefly searches the previous profile's messages against
  the new profile's conversations. Gating `useLiveQuery` on `active` keeps the
  "no read until active" guarantee while removing both staleness modes.

### D6 — Module layout (cap-driven)

- `application/chat/search-conversations.ts` — pure use case: `(query,
conversations, messages) → SearchResult[]`. Unit-tested.
- `application/chat/normalize-search-text.ts` — normalization + tokenization helper.
- `application/chat/build-snippet.ts` — windowing + match-range computation.
- `hooks/use-chat-search.ts` — debounce, live-while-active message read, orchestration.
- `components/organisms/Chat/ChatSearchResults.tsx` + a search box wired into
  `ChatWorkspace`/`ConversationList`; `ChatMessageList` gains `focusMessageId`.

`SearchResult = { conversationId, title, titleMatch, messageMatches: {
messageId, role, snippet, ranges }[] }`.

## Risks / Trade-offs

- **Recall over precision (D2)** → A long thread that mentions tokens in unrelated
  places can match. Mitigated by ranking (frequency/title/recency) and by surfacing
  the most-matching messages first, so noise sinks rather than misleads.
- **Loading all profile messages into memory on search** → Acceptable for a
  single-user personal app's volume; debounced and only while search is active. If
  volume ever grows, D1's use-case seam allows swapping in an index without UI
  changes.
- **Live subscription recomputes results on every message change (D5)** → While
  searching, an `append` re-fires the query and re-runs `searchConversations`.
  In practice a user rarely chats and searches simultaneously, the gate keeps the
  subscription off otherwise, and the recompute is a bounded in-memory pass; the
  staleness it removes outweighs the occasional extra pass.
- **No stopwords** → Common short words ("de", "la") become required tokens, but
  under AND over Spanish prose they are almost always satisfied, so recall is
  barely affected; the cost is negligible and avoids language-specific lists.
- **Substring tokens cross word boundaries** ("vo2" matches "vo2max") → Intended;
  desirable for shorthand. Documented so it is not mistaken for a bug.

## Migration Plan

None. The change is additive and read-only: no Dexie version bump, no data
migration, no port or public-API change. Rollback is removal of the new files and
the search box wiring; existing chat behavior is untouched.

## Open Questions

- None blocking. Minor presentation tuning (exact snippet ellipsis glyph, score
  weights for title vs frequency) can be finalized during implementation against
  the spec scenarios.
