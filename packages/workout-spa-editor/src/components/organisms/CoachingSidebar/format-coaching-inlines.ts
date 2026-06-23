export type DescriptionInline =
  | { kind: "text"; value: string }
  | { kind: "strong"; value: string }
  | { kind: "link"; href: string; label: string };

export type DescriptionParagraph = {
  inlines: DescriptionInline[];
};

// Ordered alternation, scanned left-to-right per position:
//   1 HTML strong inner · 2 markdown bold inner · 3 link label +
//   4 link url · 5 bare https url. The link/url char classes exclude
//   ')' and whitespace so a link can't swallow following prose.
const TOKEN_RE =
  /<strong\b[^>]*>([\s\S]*?)<\/strong>|\*\*([^*\n][^*]*?)\*\*|\[([^\]]+)\]\(([^)\s]+)\)|(https:\/\/[^\s<>()]+)/gi;

const isHttpsUrl = (url: string): boolean => {
  try {
    return new URL(url).protocol === "https:";
  } catch {
    return false;
  }
};

const stripTagsExceptStrong = (html: string): string => {
  // Remove every tag except <strong>...</strong> markers (the strong
  // splitter below extracts those before this strip). Looped until
  // stable: a single pass can re-form a tag from interleaved input
  // (e.g. `<scr<b>ipt` -> `<script`).
  let text = html;
  let prev: string;
  do {
    prev = text;
    text = text.replace(/<\/?(?!strong\b)[^>]+>/gi, "");
  } while (text !== prev);
  return text.trim();
};

const ENTITY_REPLACEMENTS: Record<string, string> = {
  "&amp;": "&",
  "&lt;": "<",
  "&gt;": ">",
  "&quot;": '"',
  "&#39;": "'",
  "&nbsp;": " ",
};

// Single-pass decode: sequential .replace() chains double-decode
// payloads like `&amp;lt;` (first pass yields `&lt;`, second `<`).
const decodeEntities = (s: string): string =>
  s.replace(
    /&(?:amp|lt|gt|quot|#39|nbsp);/g,
    (entity) => ENTITY_REPLACEMENTS[entity] ?? entity
  );

const clean = (s: string): string => decodeEntities(stripTagsExceptStrong(s));

// Maps a TOKEN_RE match to its inline node. A non-https markdown link
// degrades to its plain-text label (the URL is dropped, never rendered).
const matchToInline = (m: RegExpMatchArray): DescriptionInline | null => {
  const [, htmlStrong, mdStrong, label, url, bareUrl] = m;
  if (htmlStrong !== undefined || mdStrong !== undefined) {
    const inner = clean(htmlStrong ?? mdStrong ?? "");
    return inner ? { kind: "strong", value: inner } : null;
  }
  if (label !== undefined && url !== undefined) {
    const text = clean(label);
    if (!text) return null;
    return isHttpsUrl(url)
      ? { kind: "link", href: url, label: text }
      : { kind: "text", value: text };
  }
  if (bareUrl !== undefined) {
    return { kind: "link", href: bareUrl, label: bareUrl };
  }
  return null;
};

export const splitInlines = (paragraph: string): DescriptionInline[] => {
  const inlines: DescriptionInline[] = [];
  let lastIndex = 0;
  for (const match of paragraph.matchAll(TOKEN_RE)) {
    const start = match.index ?? 0;
    if (start > lastIndex) {
      const text = clean(paragraph.slice(lastIndex, start));
      if (text) inlines.push({ kind: "text", value: text });
    }
    const inline = matchToInline(match);
    if (inline) inlines.push(inline);
    lastIndex = start + match[0].length;
  }
  if (lastIndex < paragraph.length) {
    const tail = clean(paragraph.slice(lastIndex));
    if (tail) inlines.push({ kind: "text", value: tail });
  }
  return inlines;
};
