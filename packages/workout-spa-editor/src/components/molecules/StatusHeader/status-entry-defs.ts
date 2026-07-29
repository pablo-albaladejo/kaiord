import type { ComponentType } from "react";

import type { NavDestination } from "../../../routing/nav-destinations";
import {
  NAV_DESTINATIONS,
  navChildrenOf,
} from "../../../routing/nav-destinations";
import { ICON_MAP } from "../../atoms/Icon/icon-map";

/**
 * How wide the viewport has to be for this entry to occupy a slot in the
 * header bar. `wide` entries move into the "More" menu below `lg`;
 * `desktop` entries are the ones the mobile bottom nav or the create FAB
 * already covers, so the bar drops them below `md` rather than showing the
 * same destination twice on one screen.
 */
export type BarVisibility = "always" | "desktop" | "wide";

export type EntryDef = {
  id: string;
  icon: ComponentType<{ className?: string }>;
  ariaLabel?: string;
  to: string;
  variant?: "primary" | "tertiary";
  barVisibility: BarVisibility;
  /** The mobile bottom nav already carries this destination, so the "More"
      menu hides its row below `md` rather than offering it twice. */
  bottomNavCovered: boolean;
  /** Rendered as a dropdown under this entry (Labs under Trends). */
  children: readonly EntryDef[];
};

/** Only the "new workout" entry gets the primary CTA treatment; every other
    header entry renders as a tertiary nav button. This is a header-only
    presentation concern, so it stays local instead of living on the neutral
    nav-destinations registry. */
const PRIMARY_VARIANT_IDS: ReadonlySet<string> = new Set(["new"]);

const visibilityOf = (destination: NavDestination): BarVisibility => {
  if (destination.surfaces.overflow) return "wide";
  const { bottomNav, mobileFab } = destination.surfaces;
  return bottomNav || mobileFab ? "desktop" : "always";
};

const toEntry = (destination: NavDestination): EntryDef => ({
  id: destination.id,
  icon: ICON_MAP[destination.icon],
  ariaLabel: destination.ariaLabel,
  to: destination.path,
  variant: PRIMARY_VARIANT_IDS.has(destination.id) ? "primary" : undefined,
  barVisibility: visibilityOf(destination),
  bottomNavCovered: destination.surfaces.bottomNav,
  children: navChildrenOf(destination.id).map(toEntry),
});

/** Everything with a slot in the header bar, in registry order. */
export const BAR_ENTRIES: ReadonlyArray<EntryDef> = NAV_DESTINATIONS.filter(
  (d) => d.surfaces.bar || d.surfaces.overflow
).map(toEntry);

/** What the "More" menu holds below `lg` — the same entries the bar hides
    there, each followed by its own children, so a nested destination never
    becomes unreachable just because its parent lost its slot. */
export const OVERFLOW_ENTRIES: ReadonlyArray<EntryDef> = BAR_ENTRIES.filter(
  (entry) => entry.barVisibility === "wide"
).flatMap((entry) => [entry, ...entry.children]);

/** Account-level destinations, which live only in the avatar menu. */
export const ACCOUNT_ENTRIES: ReadonlyArray<EntryDef> = NAV_DESTINATIONS.filter(
  (d) => d.surfaces.accountMenu
).map(toEntry);
