/**
 * Call-site helper that appends `?from=<origin>` to a navigation href,
 * composing cleanly with existing `?date=` / `?source=` params. App
 * hrefs never contain a second `?`, so the split is unambiguous.
 */

import type { BackOrigin } from "./back-origin";

export function withOrigin(href: string, origin: BackOrigin): string {
  const [path, query = ""] = href.split("?");
  const params = new URLSearchParams(query);
  params.set("from", origin);
  return `${path}?${params.toString()}`;
}
