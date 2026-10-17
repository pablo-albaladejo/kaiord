import { safeHref } from "./safe-href";

export type Inline =
  | { kind: "text"; text: string }
  | { kind: "code"; text: string }
  | { kind: "strong" | "em"; children: Inline[] }
  | { kind: "link"; href: string | null; children: Inline[] };

/* One pass, earliest match wins; at the same index the order below decides.
   Groups: 1 escape, 2 code, 3-4 link, 5-6 strong, 7-8 em, 9 bare URL. An
   unclosed marker (a token still streaming) matches nothing and stays text. */
const INLINE =
  /\\([\\`*_[\]()#+\-.!|>~])|`([^`\n]+)`|\[([^[\]\n]+)\]\(([^()\s]+)\)|\*\*(?=\S)(.+?)\*\*|(?<!\w)__(?=\S)(.+?)__(?!\w)|\*(?=[^\s*])([^*\n]+?)\*|(?<!\w)_(?=[^\s_])([^_\n]+?)_(?!\w)|(https?:\/\/[^\s<>()]*[^\s<>().,:;!?"'\]])/g;

/** Inline markdown → tokens: `code`, **strong**, *em*, [links](url), bare URLs
 * and backslash escapes. Everything else, raw HTML included, is text. */
export function parseInline(text: string): Inline[] {
  const out: Inline[] = [];
  let last = 0;
  for (const match of text.matchAll(INLINE)) {
    if (match.index > last)
      out.push({ kind: "text", text: text.slice(last, match.index) });
    out.push(toToken(match));
    last = match.index + match[0].length;
  }
  if (last < text.length) out.push({ kind: "text", text: text.slice(last) });
  return out;
}

function toToken(match: RegExpExecArray): Inline {
  const [, escaped, code, label, url, s1, s2, e1, e2, bare] = match;
  if (escaped !== undefined) return { kind: "text", text: escaped };
  if (code !== undefined) return { kind: "code", text: code };
  if (label !== undefined)
    return {
      kind: "link",
      href: safeHref(url ?? ""),
      children: parseInline(label),
    };
  const strong = s1 ?? s2;
  if (strong !== undefined)
    return { kind: "strong", children: parseInline(strong) };
  const em = e1 ?? e2;
  if (em !== undefined) return { kind: "em", children: parseInline(em) };
  const href = bare ?? "";
  return {
    kind: "link",
    href: safeHref(href),
    children: [{ kind: "text", text: href }],
  };
}
