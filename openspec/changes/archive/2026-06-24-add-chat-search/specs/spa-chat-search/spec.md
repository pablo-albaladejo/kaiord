## ADDED Requirements

### Requirement: Search query normalization and tokenization

The SPA SHALL normalize both the search query and the searched text by Unicode
NFD decomposition, stripping diacritics, and lowercasing, so matching is accent-
and case-insensitive. The normalized query SHALL be split on whitespace into
tokens; tokens of a single character SHALL be discarded. No stopword list and no
fuzzy/edit-distance matching SHALL be applied.

#### Scenario: Accents and case are ignored

- **GIVEN** a conversation whose content contains "Úmbral funcional"
- **WHEN** the user searches for "umbral"
- **THEN** the conversation SHALL match, because both query and content normalize to "umbral"

#### Scenario: Single-character tokens are discarded

- **WHEN** the user searches for "y vo2"
- **THEN** the token "y" SHALL be discarded and only "vo2" SHALL be required for matching

#### Scenario: Two-character tokens are preserved

- **WHEN** the user searches for "z4"
- **THEN** the token "z4" SHALL be retained and used for matching

#### Scenario: Empty effective query yields no search

- **WHEN** the query is empty or contains only whitespace and single-character tokens
- **THEN** no search SHALL run and the normal conversation list SHALL remain visible

### Requirement: Conversation-level token-AND match

A conversation SHALL match a search when its title together with all of its
messages contains every query token. Each token SHALL match as a case-insensitive,
accent-insensitive substring (e.g. "vo2" matches "vo2max"). Tokens MAY be satisfied
by different messages within the same conversation; they need not co-occur in a
single message or in the title.

#### Scenario: Tokens spread across different messages still match

- **GIVEN** a conversation where one message contains "umbral" and a different message contains "vo2"
- **WHEN** the user searches for "umbral vo2"
- **THEN** the conversation SHALL match because the combined title and messages contain both tokens

#### Scenario: Missing token excludes the conversation

- **GIVEN** a conversation whose title and messages contain "umbral" but never "vo2"
- **WHEN** the user searches for "umbral vo2"
- **THEN** the conversation SHALL NOT appear in the results

#### Scenario: Substring token matches within a longer word

- **GIVEN** a conversation containing "vo2max"
- **WHEN** the user searches for "vo2"
- **THEN** the conversation SHALL match

#### Scenario: Title-only match is sufficient

- **GIVEN** a conversation whose title contains "umbral" but whose messages do not
- **WHEN** the user searches for "umbral"
- **THEN** the conversation SHALL match on the title alone

### Requirement: Result ranking

Matching conversations SHALL be ordered by a relevance score that boosts a
title match and adds the frequency of token occurrences across the conversation's
messages, breaking ties by `updatedAt` descending (most recently active first).
Within each conversation, matched messages SHALL be ordered so that messages
matching more distinct tokens appear first.

#### Scenario: Title match outranks a content-only match

- **GIVEN** conversation A matches a token in its title and conversation B matches the same token only in message content, with otherwise equal frequency
- **WHEN** the results are produced
- **THEN** conversation A SHALL be ranked above conversation B

#### Scenario: More frequent matches rank higher

- **GIVEN** two conversations match the query only in content, with equal title state, where conversation A contains the tokens more times than conversation B
- **WHEN** the results are produced
- **THEN** conversation A SHALL be ranked above conversation B

#### Scenario: Ties break by recency

- **GIVEN** two matching conversations with equal relevance score
- **WHEN** the results are produced
- **THEN** the conversation with the more recent `updatedAt` SHALL be ranked first

#### Scenario: Messages matching more tokens surface first within a conversation

- **GIVEN** a matching conversation where message X contains both query tokens and message Y contains only one
- **WHEN** that conversation's matched messages are listed
- **THEN** message X SHALL appear before message Y

### Requirement: Result snippet and highlight

Each matched message result SHALL present a snippet anchored on the matched token
of highest rank in that message, including up to 30 characters of context on each
side of the matched span, with an ellipsis where the surrounding text is truncated.
The matched token span SHALL be highlighted with a static yellow style and SHALL
NOT animate.

#### Scenario: Snippet windows context around the match

- **GIVEN** a matched message far longer than 30 characters on both sides of the matched token
- **WHEN** the snippet is built
- **THEN** it SHALL include at most 30 characters before and 30 after the matched span and SHALL mark each truncated side with an ellipsis

#### Scenario: Short content is not padded or truncated with ellipsis

- **GIVEN** a matched message shorter than the snippet window on a side
- **WHEN** the snippet is built
- **THEN** that side SHALL show the full text with no leading or trailing ellipsis

#### Scenario: Matched span is highlighted statically

- **WHEN** a snippet is rendered
- **THEN** the matched token span SHALL be wrapped in a static yellow highlight with no animation or fade

### Requirement: Search results UI and scroll-to-message

The chat page SHALL render a search box above the conversation list. While the
effective query is non-empty, a results panel SHALL replace the conversation list
and SHALL offer a way to clear the query and restore the list. Selecting a result
SHALL open the result's conversation and scroll to the matched message, highlighting
that message with the same static yellow until the search changes. The matched-message
focus SHALL be transient navigation state and SHALL NOT alter the deep-link URL,
which remains `/chat/:conversationId`.

#### Scenario: Results panel replaces the list while searching

- **GIVEN** the user has typed an effective query
- **WHEN** the results render
- **THEN** the conversation list SHALL be replaced by the results panel and a clear affordance SHALL be present

#### Scenario: Clearing the query restores the list

- **GIVEN** a non-empty query with a visible results panel
- **WHEN** the user clears the query
- **THEN** the results panel SHALL be removed and the normal conversation list SHALL reappear

#### Scenario: Selecting a result focuses the message

- **GIVEN** a results panel listing a matched message in conversation C
- **WHEN** the user selects that result
- **THEN** conversation C SHALL open, the matched message SHALL be scrolled into view and highlighted in static yellow, and the URL SHALL remain `/chat/C`

### Requirement: Read-only, lazily-loaded search

The search SHALL be read-only: it SHALL NOT write to or migrate any Dexie store,
add any port, or affect cross-device sync. Profile messages used for searching
SHALL be read via the existing per-profile message read only while search is
active, through a reactive (live) subscription so that messages appended during
the session and a profile switch are reflected without remounting. Query input
SHALL be debounced before searching.

#### Scenario: Searching performs no writes

- **WHEN** the user runs any search
- **THEN** no `chatConversations` or `chatMessages` row SHALL be created, updated, or deleted

#### Scenario: Messages load only when search is active

- **GIVEN** the user has not engaged the search box
- **WHEN** the chat page renders
- **THEN** the per-profile message read for search SHALL NOT run until the search becomes active

#### Scenario: Messages appended during an active search become searchable

- **GIVEN** the user has an effective query active and is viewing results
- **WHEN** a new message is appended to the active profile (e.g. a chat sent in the same session)
- **THEN** the search results SHALL update to reflect that message without requiring a remount

#### Scenario: Switching profiles does not search the previous profile's messages

- **GIVEN** the user has an effective query active for one profile
- **WHEN** the active profile changes
- **THEN** the results SHALL be computed from the new profile's messages only, never from the previous profile's messages
