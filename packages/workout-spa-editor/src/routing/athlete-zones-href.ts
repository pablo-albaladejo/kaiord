import type { SportKey } from "../types/sport-zones";

/** The one zone editor, per sport (audit P-01). */
export const athleteZonesHref = (sport: SportKey): string =>
  `/athlete/zones/${sport}`;
