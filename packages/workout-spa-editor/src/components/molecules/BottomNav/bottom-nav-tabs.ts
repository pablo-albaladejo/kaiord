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
  { label: "Today", icon: "today", path: "/calendar" },
  { label: "Library", icon: "cards", path: "/library" },
  { label: "Athlete", icon: "athlete", path: "/athlete" },
  { label: "Settings", icon: "gear", path: "/settings" },
] as const;

/**
 * Derives whether a tab is active for the current location.
 * - Today: exact `/calendar` or the index route `/`.
 * - Settings: any `/settings`-prefixed path.
 * - Others: exact match.
 */
export function isTabActive(tabPath: string, location: string): boolean {
  if (tabPath === "/calendar") {
    return location === "/calendar" || location === "/";
  }
  if (tabPath === "/settings") {
    return location === "/settings" || location.startsWith("/settings/");
  }
  return location === tabPath;
}
