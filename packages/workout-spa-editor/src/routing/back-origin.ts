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
  "daily",
  "detail",
] as const;

export type BackOrigin = (typeof BACK_ORIGINS)[number];

/**
 * Legacy `?from=` tokens kept parseable for in-flight links shipped before a
 * rename (so they resolve to the new surface, not the calendar fallback).
 * `today` → `daily` (page renamed in #731/#734). Retire once aged out.
 */
const LEGACY_ORIGINS: Readonly<Record<string, BackOrigin>> = { today: "daily" };

export function parseBackOrigin(raw: string | null): BackOrigin | null {
  const value = raw ?? "";
  if ((BACK_ORIGINS as readonly string[]).includes(value)) {
    return value as BackOrigin;
  }
  return LEGACY_ORIGINS[value] ?? null;
}
