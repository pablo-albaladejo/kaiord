import type { ComponentType } from "react";

import type { NavDestination } from "../../../routing/nav-destinations";
import { navChildrenOf } from "../../../routing/nav-destinations";
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
  barVisibility: BarVisibility;
  /** The mobile bottom nav already carries this destination, so the "More"
      menu hides its row below `md` rather than offering it twice. */
  bottomNavCovered: boolean;
  /** Rendered as a dropdown under this entry (Labs under Trends). */
  children: readonly EntryDef[];
};

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
  barVisibility: visibilityOf(destination),
  bottomNavCovered: destination.surfaces.bottomNav,
  children: navChildrenOf(destination.id).map(toEntry),
});

export type StatusEntries = {
  /** Everything with a slot in the header bar, in registry order. */
  bar: ReadonlyArray<EntryDef>;
  /** What the "More" menu holds below `lg` — the same entries the bar hides
      there, each followed by its own children, so a nested destination never
      becomes unreachable just because its parent lost its slot. */
  overflow: ReadonlyArray<EntryDef>;
  /** Account-level destinations, which live only in the avatar menu. */
  account: ReadonlyArray<EntryDef>;
};

/** The header's entries among the destinations the athlete is offered. */
export const statusEntriesOf = (
  destinations: readonly NavDestination[]
): StatusEntries => {
  const offered = new Set(destinations.map((d) => d.id));
  const toOfferedEntry = (destination: NavDestination): EntryDef => ({
    ...toEntry(destination),
    children: navChildrenOf(destination.id)
      .filter((child) => offered.has(child.id))
      .map(toEntry),
  });
  const bar = destinations
    .filter((d) => d.parentId === undefined)
    .filter((d) => d.surfaces.bar || d.surfaces.overflow)
    .map(toOfferedEntry);
  return {
    bar,
    overflow: bar
      .filter((entry) => entry.barVisibility === "wide")
      .flatMap((entry) => [entry, ...entry.children]),
    account: destinations.filter((d) => d.surfaces.accountMenu).map(toEntry),
  };
};
