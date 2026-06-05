/**
 * Call-site helper that appends `?from=<origin>` to a navigation href,
 * composing cleanly with existing `?date=` / `?source=` params. App
 * hrefs never contain a second `?`, so the split is unambiguous.
 *
 * `opts.week` carries the originating `/calendar/:weekId` so calendar
 * back-targets return to THAT week (bare `/calendar` redirects to the
 * current week since the /today split).
 */

import type { BackOrigin } from "./back-origin";

export type WithOriginOpts = { week?: string };

export function withOrigin(
  href: string,
  origin: BackOrigin,
  opts: WithOriginOpts = {}
): string {
  const [path, query = ""] = href.split("?");
  const params = new URLSearchParams(query);
  params.set("from", origin);
  if (opts.week) params.set("week", opts.week);
  return `${path}?${params.toString()}`;
}
