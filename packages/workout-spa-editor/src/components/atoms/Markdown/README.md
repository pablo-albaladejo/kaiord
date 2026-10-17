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
- Links `[label](url)` and bare `https://` URLs: only absolute `http:`/`https:`
  hrefs become anchors (`target="_blank"`, `rel="noopener noreferrer"`); any other
  scheme or a relative path renders the label as plain text

## Streaming

Partial input never throws. An unclosed fence runs to the end as code; an unclosed
`**` stays literal until it closes; a table header stays a paragraph until its
`---|---` row arrives.

## Usage

```tsx
<Markdown source={message.content} />
```

User messages stay plain text; only the assistant's are rendered as markdown.
