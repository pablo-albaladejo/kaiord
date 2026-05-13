/**
 * Sport canonicalization for the Train2Go three-slot grouping.
 *
 * Different sources spell the same sport differently:
 *   - Train2Go: `"bike"`, `"BIKE"`, `"running"`, `"swim"`, ...
 *   - Garmin/FIT workout records: `"cycling"`, `"running"`, `"swimming"`, ...
 *
 * The canonical key is the KRD sport vocabulary (see
 * `subSportSchema.enum` in `@kaiord/core` for the full list — we use the
 * top-level sport name here, not the sub-sport). Returning `null`
 * signals "unknown sport, cannot match"; callers MUST treat that as a
 * non-match (never widen to "match all").
 */

const CYCLING = "cycling";
const RUNNING = "running";
const SWIMMING = "swimming";

const ALIASES: Record<string, string> = {
  // Cycling family
  bike: CYCLING,
  bici: CYCLING,
  ciclismo: CYCLING,
  cycling: CYCLING,
  mtb: CYCLING,
  mountainbike: CYCLING,
  stationarybike: CYCLING,
  indoorbike: CYCLING,
  indoorcycling: CYCLING,
  gravel: CYCLING,
  gravelcycling: CYCLING,
  road: CYCLING,
  roadcycling: CYCLING,
  // Running family
  run: RUNNING,
  running: RUNNING,
  correr: RUNNING,
  carrera: RUNNING,
  trail: RUNNING,
  trailrunning: RUNNING,
  sprint: RUNNING,
  treadmill: RUNNING,
  indoorrunning: RUNNING,
  // Swimming family
  swim: SWIMMING,
  swimming: SWIMMING,
  natacion: SWIMMING,
  openwater: SWIMMING,
  lapswimming: SWIMMING,
};

const normalize = (raw: string): string =>
  raw.toLowerCase().replace(/[\s_-]+/g, "");

export const canonicalizeSport = (input: string): string | null => {
  if (!input) return null;
  const key = normalize(input);
  if (!key) return null;
  return ALIASES[key] ?? null;
};
