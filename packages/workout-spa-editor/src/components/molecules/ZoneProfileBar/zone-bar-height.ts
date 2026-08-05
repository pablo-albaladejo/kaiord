import type { CalendarView } from "../../../types/user-preferences";

/**
 * The zone-profile bar's height per surface, in px. The grid cell is narrow
 * and the bar sits between two lines of text; the list row has the width to
 * let the ramp read. The library card mounts the same component at 10 px.
 */
export const ZONE_BAR_HEIGHT: Record<CalendarView, number> = {
  grid: 14,
  list: 20,
};
