import type { IconName } from "../components/atoms/Icon/icon-map";

/**
 * Which chrome a destination is reachable from. Spelled as a code so the
 * table below stays a table:
 *
 *   `bar`      the primary header row, at every width that row shows it
 *   `overflow` the primary header row at `lg`, the "More" menu below it
 *   `account`  the avatar menu — account-level, never a nav-bar entry
 *   `nested`   a child row inside its parent's header dropdown
 *   `page`     no shell chrome: each consuming route renders the CTA in its
 *              own action row (below `md` the create FAB still covers it)
 */
export type NavSurfaceCode = "bar" | "overflow" | "account" | "nested" | "page";

/**
 * `[id, path, ariaLabel, icon, surface, bottomNav, parentId?]`.
 *
 * There is no label column: labels come from the `nav` i18n namespace keyed
 * by `id`. `ariaLabel` holds the English accessible-name override so the row
 * documents which entries have one; the rendered string is `aria.<id>` from
 * the same namespace.
 */
export type NavRow = readonly [
  string,
  string,
  string | undefined,
  IconName,
  NavSurfaceCode,
  boolean,
  string?,
];

/**
 * The app's navigation table. Order is render order: the header bar, the
 * overflow menu and the mobile bottom nav each render their own subset
 * without re-sorting, so the tablet bar reads as a prefix of the desktop bar
 * rather than as a different arrangement.
 */
export const NAV_ROWS: readonly NavRow[] = [
  ["daily", "/daily", "Go to daily", "today", "bar", true],
  ["calendar", "/calendar", "Go to calendar", "calendar", "bar", true],
  ["library", "/library", "Open workout library", "cards", "bar", true],
  ["nutrition", "/nutrition", "Open nutrition", "nutrition", "overflow", true],
  ["trends", "/health", "Open wellness trends", "trend", "overflow", false],
  ["labs", "/health/labs", "Open labs", "labs", "nested", false, "trends"],
  ["chat", "/chat", "Open chat assistant", "chat", "overflow", false],
  ["athlete", "/athlete", "Open athlete profile", "athlete", "bar", true],
  ["new", "/workout/new", undefined, "plus", "page", false],
  [
    "connections",
    "/settings/connections",
    "Open connections",
    "link",
    "account",
    false,
  ],
  ["settings", "/settings", "Open settings", "gear", "account", false],
];
