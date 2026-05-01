/**
 * Canonical sport-family mapping used by the auto-match heuristic and
 * the "Match to..." picker.
 *
 * Unmapped sports return their raw key (lowercased) — yoga and kayaking
 * are NOT collapsed into a shared "other" pool, which would cause the
 * auto-match enumerator to pair unrelated sessions.
 */

const FAMILIES: Record<string, string> = {
  swim: "swimming",
  open_water_swim: "swimming",
  lap_swimming: "swimming",
  pool_swim: "swimming",

  bike: "cycling",
  cycling: "cycling",
  road_cycling: "cycling",
  gravel_cycling: "cycling",
  mountain_biking: "cycling",
  indoor_cycling: "cycling",
  virtual_cycle: "cycling",

  run: "running",
  running: "running",
  trail_running: "running",
  treadmill_running: "running",
  track_running: "running",

  gym: "strength",
  strength: "strength",
  strength_training: "strength",
  weightlifting: "strength",
  core: "strength",
};

export function canonicalSportFamily(sport: string): string {
  const key = sport.toLowerCase();
  return FAMILIES[key] ?? key;
}
