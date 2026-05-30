/* Canonical 5-zone intensity models for the Athlete zone map. The repo stores
   richer per-metric zones (e.g. 7-zone coggan power); this module derives the
   fixed 5-zone view the redesign displays, computed from a single threshold.
   `bounds` are the four internal boundaries as a fraction of the threshold
   (ascending). For power/HR a larger fraction = a larger value (Z1 lowest);
   for pace the fraction is a SPEED fraction, so a larger fraction = a faster
   (smaller) time and thus a higher zone. */

export type ZoneBandKind = "ascending" | "pace";

export type ZoneBandModel = {
  kind: ZoneBandKind;
  names: readonly [string, string, string, string, string];
  pcts: readonly [string, string, string, string, string];
  bounds: readonly [number, number, number, number];
};

const ZONE_NAMES = [
  "Recovery",
  "Endurance",
  "Tempo",
  "Threshold",
  "VO₂ Max",
] as const;

/** Visual segment weights (decorative) matching the design's cycling zone bar. */
export const ZONE_WEIGHTS = [0.16, 0.26, 0.2, 0.2, 0.18] as const;

/** Power as % of FTP — the simplified 5-zone model (55/75/90/105%). */
export const POWER_MODEL: ZoneBandModel = {
  kind: "ascending",
  names: ZONE_NAMES,
  pcts: ["< 55%", "55–75%", "75–90%", "90–105%", "> 105%"],
  bounds: [0.55, 0.75, 0.9, 1.05],
};

/** Heart rate as % of LTHR (threshold HR). */
export const HR_MODEL: ZoneBandModel = {
  kind: "ascending",
  names: ZONE_NAMES,
  pcts: ["< 82%", "82–89%", "89–94%", "94–100%", "> 100%"],
  bounds: [0.82, 0.89, 0.94, 1.0],
};

/** Pace as a SPEED fraction of threshold pace (faster = higher zone). */
export const PACE_MODEL: ZoneBandModel = {
  kind: "pace",
  names: ZONE_NAMES,
  pcts: ["< 84%", "84–90%", "90–95%", "95–102%", "> 102%"],
  bounds: [0.84, 0.9, 0.95, 1.02],
};
