import type { LucideIcon } from "lucide-react";
import { Bike, Footprints, Waves } from "lucide-react";

/* The three sport glyphs, kept beside `sport-icon-name.ts` (which maps a
   domain sport onto one of these names). Split out of `icon-map.ts` because
   that file is at the 80-line cap; spread back in there, so `ICON_MAP.bike`
   and the `IconName` union are unchanged. */
export const SPORT_ICONS = {
  bike: Bike,
  run: Footprints,
  swim: Waves,
} as const satisfies Record<string, LucideIcon>;
