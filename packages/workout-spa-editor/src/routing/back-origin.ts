/**
 * Back-navigation origin vocabulary + parser.
 *
 * `?from=<origin>` is the URL-carried contract naming the surface a
 * navigation departed from, so the editor/detail can resolve a Back
 * target without `history.back()` (untestable under the memory-location
 * harness). The set is closed; unknown/absent values parse to `null`,
 * letting the resolver fall back to a safe in-app home.
 */

export const BACK_ORIGINS = [
  "library",
  "calendar",
  "calendar-day",
  "coaching",
  "today",
  "detail",
] as const;

export type BackOrigin = (typeof BACK_ORIGINS)[number];

export function parseBackOrigin(raw: string | null): BackOrigin | null {
  return (BACK_ORIGINS as readonly string[]).includes(raw ?? "")
    ? (raw as BackOrigin)
    : null;
}
