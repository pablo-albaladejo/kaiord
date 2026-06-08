/**
 * Call-site helper that appends `?from=<origin>` to a navigation href,
 * composing cleanly with existing `?date=` / `?source=` params. App
 * hrefs never contain a second `?`, so the split is unambiguous.
 *
 * `opts.week` carries the originating `/calendar/:weekId` so calendar
 * back-targets return to THAT week (bare `/calendar` redirects to the
 * current week since the /today split). `opts.date` carries the Today
 * page's focused day so a `today`-origin Back returns to `/today?date=`.
 */

import type { BackOrigin } from "./back-origin";

export type WithOriginOpts = { week?: string; date?: string };

export function withOrigin(
  href: string,
  origin: BackOrigin,
  opts: WithOriginOpts = {}
): string {
  const [path, query = ""] = href.split("?");
  const params = new URLSearchParams(query);
  params.set("from", origin);
  if (opts.week) params.set("week", opts.week);
  if (opts.date) params.set("date", opts.date);
  return `${path}?${params.toString()}`;
}
