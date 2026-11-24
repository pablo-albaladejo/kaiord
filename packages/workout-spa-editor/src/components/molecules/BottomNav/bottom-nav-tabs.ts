import { ATHLETE_PATH, ATHLETES_PATH } from "../../../routing/constants";
import type { NavDestination } from "../../../routing/nav-destinations";
import type { IconName } from "../../atoms/Icon";

export type BottomNavTab = {
  /** Nav-destination id; also the `nav` i18n key for the tab label. */
  id: string;
  icon: IconName;
  path: string;
};

/**
 * Tab order is registry order; the FAB sits in a notch at the bar's middle
 * (see `notchIndexOf`).
 *
 * Derived from the single nav-destinations registry
 * (`src/routing/nav-destinations.ts`) among the destinations the athlete is
 * offered — add or remove a destination's `surfaces.bottomNav` flag there
 * instead of hand-editing a list.
 */
export const bottomNavTabsOf = (
  destinations: readonly NavDestination[]
): readonly BottomNavTab[] =>
  destinations
    .filter((destination) => destination.surfaces.bottomNav)
    .map((destination) => ({
      id: destination.id,
      icon: destination.icon,
      path: destination.path,
    }));

/**
 * The tab the FAB notch renders before: the middle of the bar, rounding to
 * the right, so five tabs read 3 + FAB + 2 and four read 2 + FAB + 2.
 */
export const notchIndexOf = (tabCount: number): number =>
  Math.ceil(tabCount / 2);

/**
 * Derives whether a tab is active for the current location.
 * - Daily: exact `/daily`.
 * - Calendar: the index route `/` (default view — it replace-redirects to
 *   the current week), bare `/calendar`, or any `/calendar/:weekId` path.
 * - Athlete: `/athlete`, its sub-pages (`/athlete/zones/:sport`) and the
 *   list of athletes, `/athletes`.
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
  if (tabPath === ATHLETE_PATH) {
    return (
      location === ATHLETE_PATH ||
      location === ATHLETES_PATH ||
      location.startsWith(`${ATHLETE_PATH}/`)
    );
  }
  return location === tabPath;
}
