import type { IconName } from "../components/atoms/Icon/icon-map";

export type NavSurfaces = {
  /** The header nav renders on every breakpoint today, so this is the only
   *  guarantee of desktop reachability — every destination MUST set it. */
  header: boolean;
  /** Mobile-only fast-access tab (hidden on desktop via `md:hidden`).
   *  Capped at 5 by the floating bar's fixed layout. */
  bottomNav: boolean;
  /** True when the create-workout FAB already covers this destination below
   *  `md` — header hides it there too, without counting toward the cap above. */
  mobileFab: boolean;
};

export type NavDestination = {
  id: string;
  path: string;
  /** Display label. No i18n layer exists yet — this is the literal string
   *  shown today, named for a future i18n lookup to replace without a
   *  field rename. */
  labelKey: string;
  /** Accessible name override for the header entry. Bottom-nav tabs use
   *  the visible label as their accessible name and ignore this. */
  ariaLabel?: string;
  icon: IconName;
  surfaces: NavSurfaces;
};

/** Compact row form: [id, path, labelKey, ariaLabel, icon, header, bottomNav]. */
type NavRow = [
  string,
  string,
  string,
  string | undefined,
  IconName,
  boolean,
  boolean,
];

/**
 * Single source of truth for every navigation destination in the app
 * shell. `status-entry-defs.ts` (header) and `bottom-nav-tabs.ts` (mobile
 * bottom nav) both derive from this instead of maintaining their own list
 * — that divergence previously left Nutrition unreachable on desktop with
 * no parity check for Trends/Chat/Settings on mobile.
 *
 * See `nav-destinations.test.ts` for the enforced reachability invariant.
 */
const NAV_ROWS: readonly NavRow[] = [
  ["daily", "/daily", "Daily", "Go to daily", "today", true, true],
  [
    "calendar",
    "/calendar",
    "Calendar",
    "Go to calendar",
    "calendar",
    true,
    true,
  ],
  [
    "library",
    "/library",
    "Library",
    "Open workout library",
    "cards",
    true,
    true,
  ],
  [
    "nutrition",
    "/nutrition",
    "Nutrition",
    "Open nutrition",
    "nutrition",
    true,
    true,
  ],
  [
    "athlete",
    "/athlete",
    "Athlete",
    "Open athlete profile",
    "athlete",
    true,
    true,
  ],
  ["trends", "/health", "Trends", "Open wellness trends", "trend", true, false],
  ["labs", "/health/labs", "Labs", "Open lab analytics", "labs", true, false],
  ["chat", "/chat", "Chat", "Open chat assistant", "chat", true, false],
  ["new", "/workout/new", "New workout", undefined, "plus", true, false],
  ["settings", "/settings", "Settings", "Open settings", "gear", true, false],
];

export const NAV_DESTINATIONS: readonly NavDestination[] = NAV_ROWS.map(
  ([id, path, labelKey, ariaLabel, icon, header, bottomNav]) => ({
    id,
    path,
    labelKey,
    ariaLabel,
    icon,
    // Only the FAB (id "new") is mobile-fab-covered today; see NavSurfaces.
    surfaces: { header, bottomNav, mobileFab: id === "new" },
  })
);
