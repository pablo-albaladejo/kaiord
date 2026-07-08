import type { ComponentType } from "react";

import { NAV_DESTINATIONS } from "../../../routing/nav-destinations";
import { ICON_MAP } from "../../atoms/Icon/icon-map";

export type EntryDef = {
  id: string;
  icon: ComponentType<{ className?: string }>;
  ariaLabel?: string;
  to: string;
  variant?: "primary" | "tertiary";
  /** True when the destination also lives in the mobile bottom nav — the
      header hides it below `md` so mobile never shows duplicate entries. */
  mobileHidden?: boolean;
};

/** Only the "new workout" entry gets the primary CTA treatment; every
    other header entry renders as a tertiary nav button. This is a
    header-only presentation concern, so it stays local instead of living
    on the neutral nav-destinations registry. */
const PRIMARY_VARIANT_IDS: ReadonlySet<string> = new Set(["new"]);

/** Header entries, derived from the single nav-destinations registry
    (`src/routing/nav-destinations.ts`) so the header and the mobile
    bottom nav can never drift out of sync again. */
export const ENTRY_DEFS: ReadonlyArray<EntryDef> = NAV_DESTINATIONS.filter(
  (destination) => destination.surfaces.header
).map((destination) => ({
  id: destination.id,
  icon: ICON_MAP[destination.icon],
  ariaLabel: destination.ariaLabel,
  to: destination.path,
  variant: PRIMARY_VARIANT_IDS.has(destination.id) ? "primary" : undefined,
  mobileHidden: destination.surfaces.bottomNav,
}));
