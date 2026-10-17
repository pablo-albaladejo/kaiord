const SAFE_PROTOCOLS = new Set(["http:", "https:"]);

/** The href a model-written link may carry: an absolute http(s) URL, or none.
 * `javascript:`, `data:`, relative paths and anything unparseable return null,
 * so the label renders as plain text. The URL parser normalises case and strips
 * the tabs and newlines that disguise a scheme (`java\tscript:`). */
export function safeHref(raw: string): string | null {
  try {
    const url = new URL(raw);
    return SAFE_PROTOCOLS.has(url.protocol) ? url.href : null;
  } catch {
    return null;
  }
}
