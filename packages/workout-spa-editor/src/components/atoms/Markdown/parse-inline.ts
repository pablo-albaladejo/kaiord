import { revealedHost, safeHref } from "./safe-href";

export type Inline =
  | { kind: "text"; text: string }
  | { kind: "code"; text: string }
  | { kind: "strong" | "em"; children: Inline[] }
  | {
      kind: "link";
      href: string | null;
      host: string | null;
      children: Inline[];
    };

/* One pass, earliest match wins; at the same index the order below decides.
   Groups: 1 escape, 2 code, 3-4 link (destination may hold balanced parens
   and be followed by a "title"), 5-6 strong, 7-8 em, 9 bare URL. Each body
   stops at its own delimiter, so no two quantifiers compete for characters.
   An unclosed marker (a token still streaming) matches nothing: plain text. */
const INLINE =
  /\\([\\`*_[\]()#+\-.!|>~])|`([^`\n]+)`|\[([^[\]\n]+)\]\(\s*((?:[^()\s]|\([^()\s]*\))+)(?:\s+(?:"[^"\n]*"|'[^'\n]*'))?\s*\)|\*\*(?=\S)(.+?)\*\*|(?<!\w)__(?=\S)([^_\n]+?)__(?!\w)|\*(?=[^\s*])([^*\n]+?)\*|(?<!\w)_(?=[^\s_])([^_\n]+?)_(?!\w)|(https?:\/\/(?:[^\s<>()]|\([^\s<>()]*\))*(?:[^\s<>().,:;!?"'\]]|\([^\s<>()]*\)))/g;

/** Emphasis cannot nest deeper than this; anything below is plain text. */
const MAX_INLINE_DEPTH = 6;

/** Inline markdown → tokens: `code`, **strong**, *em*, [links](url), bare URLs
 * and backslash escapes. Everything else, raw HTML included, is text. */
export function parseInline(text: string, depth = 0): Inline[] {
  if (depth >= MAX_INLINE_DEPTH) return [{ kind: "text", text }];
  const out: Inline[] = [];
  let last = 0;
  for (const match of text.matchAll(INLINE)) {
    if (match.index > last)
      out.push({ kind: "text", text: text.slice(last, match.index) });
    out.push(toToken(match, depth + 1));
    last = match.index + match[0].length;
  }
  if (last < text.length) out.push({ kind: "text", text: text.slice(last) });
  return out;
}

function toToken(match: RegExpExecArray, depth: number): Inline {
  const [, escaped, code, label, url, s1, s2, e1, e2, bare = ""] = match;
  if (escaped !== undefined) return { kind: "text", text: escaped };
  if (code !== undefined) return { kind: "code", text: code };
  if (label !== undefined) {
    const href = safeHref(url ?? "");
    const host = href === null ? null : revealedHost(href, label);
    return { kind: "link", href, host, children: parseInline(label, depth) };
  }
  const strong = s1 ?? s2;
  if (strong !== undefined)
    return { kind: "strong", children: parseInline(strong, depth) };
  const em = e1 ?? e2;
  if (em !== undefined) return { kind: "em", children: parseInline(em, depth) };
  // A bare URL's text is its own label: an IDN look-alike (Cyrillic "а" in
  // pаypal.com) differs from its punycode host, which is then shown.
  const href = safeHref(bare);
  const host = href === null ? null : revealedHost(href, bare);
  const text: Inline = { kind: "text", text: bare };
  return { kind: "link", href, host, children: [text] };
}
