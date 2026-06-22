import type { IconName } from "../../atoms/Icon";

export type BottomNavTab = {
  label: string;
  icon: IconName;
  path: string;
};

/**
 * Tab order matches the floating bottom-nav layout: the FAB occupies a
 * visual notch between Library and Nutrition (the central slot of the
 * five tabs), keeping the raised create button centered on the bar.
 */
export const BOTTOM_NAV_TABS: readonly BottomNavTab[] = [
  { label: "Daily", icon: "today", path: "/daily" },
  { label: "Calendar", icon: "calendar", path: "/calendar" },
  { label: "Library", icon: "cards", path: "/library" },
  { label: "Nutrition", icon: "nutrition", path: "/nutrition" },
  { label: "Athlete", icon: "athlete", path: "/athlete" },
] as const;

/**
 * Derives whether a tab is active for the current location.
 * - Daily: exact `/daily`.
 * - Calendar: the index route `/` (default view — it replace-redirects to
 *   the current week), bare `/calendar`, or any `/calendar/:weekId` path.
 * - Others: exact match. (Settings left the bottom-nav with the /daily
 *   split — it remains reachable from the header.)
 */
export function isTabActive(tabPath: string, location: string): boolean {
  if (tabPath === "/daily") {
    return location === "/daily";
  }
  if (tabPath === "/calendar") {
    return (
      location === "/" ||
      location === "/calendar" ||
      location.startsWith("/calendar/")
    );
  }
  return location === tabPath;
}
