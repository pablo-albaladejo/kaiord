const SAFE_PROTOCOLS = new Set(["http:", "https:"]);

/** The href a model-written link may carry: an absolute http(s) URL, or none.
 * `javascript:`, `data:`, relative paths and anything unparseable return null,
 * so the label renders as plain text. The URL parser normalises case and strips
 * the tabs and newlines that disguise a scheme (`java\tscript:`). Credentials
 * are refused too: `https://garmin.com@evil.com` reads as Garmin but is not. */
export function safeHref(raw: string): string | null {
  try {
    const url = new URL(raw);
    if (!SAFE_PROTOCOLS.has(url.protocol)) return null;
    if (url.username !== "" || url.password !== "") return null;
    return url.href;
  } catch {
    return null;
  }
}

/** The host to show beside a link whose label does not already name it, so
 * "Reconnect Garmin" pointing at evil.com reads "Reconnect Garmin (evil.com)". */
export function revealedHost(href: string, label: string): string | null {
  const host = new URL(href).hostname;
  const bare = stripPrefix(host, "www.");
  let shown = label.trim().toLowerCase();
  shown = stripPrefix(stripPrefix(shown, "https://"), "http://");
  shown = stripPrefix(shown, "www.");
  const named = shown === bare || shown.startsWith(`${bare}/`);
  return named ? null : host;
}

function stripPrefix(text: string, prefix: string): string {
  return text.startsWith(prefix) ? text.slice(prefix.length) : text;
}
