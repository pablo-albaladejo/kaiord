import type { IconName } from "../../atoms/Icon";

export type BottomNavTab = {
  label: string;
  icon: IconName;
  path: string;
};

/**
 * Tab order matches the floating bottom-nav layout: the FAB occupies a
 * visual notch between Library and Athlete.
 */
export const BOTTOM_NAV_TABS: readonly BottomNavTab[] = [
  { label: "Today", icon: "today", path: "/today" },
  { label: "Calendar", icon: "calendar", path: "/calendar" },
  { label: "Library", icon: "cards", path: "/library" },
  { label: "Athlete", icon: "athlete", path: "/athlete" },
] as const;

/**
 * Derives whether a tab is active for the current location.
 * - Today: exact `/today` or the index route `/`.
 * - Calendar: bare `/calendar` or any week-grid `/calendar/:weekId` path.
 * - Others: exact match. (Settings left the bottom-nav with the /today
 *   split — it remains reachable from the header.)
 */
export function isTabActive(tabPath: string, location: string): boolean {
  if (tabPath === "/today") {
    return location === "/today" || location === "/";
  }
  if (tabPath === "/calendar") {
    return location === "/calendar" || location.startsWith("/calendar/");
  }
  return location === tabPath;
}
