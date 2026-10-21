# Markdown

Safe markdown for assistant replies in the chat. A small parser in this folder
turns the source into React elements; there is no `dangerouslySetInnerHTML`
and no HTML path, so raw HTML in a reply is shown as text.

## Supported

- Paragraphs (single newlines kept as line breaks), `#` headings shown as bold lines
- `**bold**`, `*italic*` / `_italic_`, `` `inline code` ``, fenced code blocks
- Ordered (keeps `start`) and unordered lists, nested by indentation
- Blockquotes and `---` rules
- GFM tables with column alignment, inside their own focusable horizontal scroll box
- Links `[label](url "title")` (balanced parens allowed in the URL) and bare
  `https://` URLs: only absolute `http:`/`https:` hrefs without credentials become
  anchors (`target="_blank"`, `rel="noopener noreferrer"`); any other scheme, a
  relative path or `user@host` renders the label as plain text. When the label does
  not name the destination, the host follows it: "Reconnect Garmin (evil.com)"

## Streaming

Partial input never throws. An unclosed fence runs to the end as code; an unclosed
`**` stays literal until it closes; a table header stays a paragraph until its
`---|---` row arrives.

## Hostile input

- Every regex is anchored and unambiguous, and the patterns that would need an
  ambiguous one (closing `#`s, rules, table delimiter rows) are checked in code.
  `parse-performance.test.ts` runs each pattern against 10 000-char attacks.
- Quotes and lists nest at most `MAX_BLOCK_DEPTH` (12) levels; the rest is one
  plain paragraph, so `>`×3000 cannot overflow the stack.
- Size caps: short table rows are never padded (the last cell spans the rest),
  a table wider than 30 columns stays text, one with more than 200 body rows
  renders as code, and all tables of one message share a budget of 5 000 cells,
  after which the remaining tables render as code. Input past 100 000 characters
  is parsed up to the last line break before the cap; the rest is plain text.
  U+2028/U+2029 are treated as line breaks.
- Bare URLs whose text differs from their punycode host (IDN look-alikes) show
  the host beside them.
- `MarkdownBoundary` catches anything that still throws and shows that message as
  plain text, so one bad reply cannot take the chat down; it reports the failure
  once per message through the logger.
- Re-parsing while streaming goes through `useDeferredValue`.

## Usage

```tsx
<Markdown source={message.content} />
```

User messages stay plain text; only the assistant's are rendered as markdown.
