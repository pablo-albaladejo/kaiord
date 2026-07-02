import { NAV_DESTINATIONS } from "../../../routing/nav-destinations";
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
 *
 * Derived from the single nav-destinations registry
 * (`src/routing/nav-destinations.ts`) — add or remove a destination's
 * `surfaces.bottomNav` flag there instead of hand-editing this list.
 */
export const BOTTOM_NAV_TABS: readonly BottomNavTab[] = NAV_DESTINATIONS.filter(
  (destination) => destination.surfaces.bottomNav
).map((destination) => ({
  label: destination.labelKey,
  icon: destination.icon,
  path: destination.path,
}));

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
