import type { IconName } from "../components/atoms/Icon/icon-map";
import type { NavSurfaceCode } from "./nav-rows";
import { NAV_ROWS } from "./nav-rows";

export type NavSurfaces = {
  /** Rendered in the primary header row, at every width that row shows it. */
  bar: boolean;
  /** In the header row at `lg`, in the "More" menu below it. Together with
   *  `bar` this is the whole desktop nav; nothing else reaches it. */
  overflow: boolean;
  /** In the avatar menu. Account-level destinations live only here — they
   *  were a second nav row, which made them look like peers of Calendar. */
  accountMenu: boolean;
  /** Mobile-only fast-access tab (hidden on desktop via `md:hidden`).
   *  Capped at 5 by the floating bar's fixed layout. */
  bottomNav: boolean;
  /** True when the create-workout FAB already covers this destination below
   *  `md` — the header hides it there too, without counting toward the cap. */
  mobileFab: boolean;
};

export type NavDestination = {
  id: string;
  path: string;
  /** Present when this entry overrides its accessible name. The rendered
   *  string is `aria.<id>` in the `nav` namespace; this is the English text
   *  it resolves to, kept so the table documents which entries have one. */
  ariaLabel?: string;
  icon: IconName;
  /** Set when this destination is reached through another one's dropdown
   *  (`labs` under `trends`) rather than from a bar slot of its own. */
  parentId?: string;
  surfaces: NavSurfaces;
};

const FAB_COVERED = "new";

const surfacesOf = (
  id: string,
  code: NavSurfaceCode,
  bottomNav: boolean
): NavSurfaces => ({
  bar: code === "bar",
  overflow: code === "overflow",
  accountMenu: code === "account",
  bottomNav,
  mobileFab: id === FAB_COVERED,
});

/**
 * Single source of truth for every navigation destination in the app
 * shell. The header bar, its "More" overflow menu, the avatar menu and the
 * mobile bottom nav all derive from this instead of maintaining their own
 * lists — that divergence previously left Nutrition unreachable on desktop
 * with no parity check for Trends/Chat/Settings on mobile.
 *
 * See `nav-destinations.test.ts` for the enforced reachability invariant.
 */
export const NAV_DESTINATIONS: readonly NavDestination[] = NAV_ROWS.map(
  ([id, path, ariaLabel, icon, code, bottomNav, parentId]) => ({
    id,
    path,
    ariaLabel,
    icon,
    parentId,
    surfaces: surfacesOf(id, code, bottomNav),
  })
);

/** Children of a header dropdown, in table order. */
export const navChildrenOf = (parentId: string): readonly NavDestination[] =>
  NAV_DESTINATIONS.filter((destination) => destination.parentId === parentId);
