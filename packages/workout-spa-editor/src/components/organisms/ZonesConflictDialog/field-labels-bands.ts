/**
 * Band-level FieldKey label and unit cross-products. Generated at
 * module-load time from a small set of hardcoded label parts; never
 * interpolates an external string. PR 3 will polish the label format.
 */
import type { BandFieldKey } from "../../../types/coaching-zones";

const SPORT_LABEL = {
  cycling: "Cycling",
  running: "Running",
  swimming: "Swimming",
} as const;

const KIND_LABEL = {
  heartRateZones: "HR",
  powerZones: "Power",
  paceZones: "Pace",
} as const;

const BOUND_LABEL = {
  minBpm: "min",
  maxBpm: "max",
  minPercent: "min",
  maxPercent: "max",
  minPace: "min",
  maxPace: "max",
} as const;

const SPORTS = ["cycling", "running", "swimming"] as const;
const BANDS = ["z1", "z2", "z3", "z4", "z5"] as const;

const buildLabel = (field: BandFieldKey): string => {
  const [sport, kind, band, bound] = field.split(".") as [
    keyof typeof SPORT_LABEL,
    keyof typeof KIND_LABEL,
    `z${1 | 2 | 3 | 4 | 5}`,
    keyof typeof BOUND_LABEL,
  ];
  return `${SPORT_LABEL[sport]} ${KIND_LABEL[kind]} ${band.toUpperCase()} ${BOUND_LABEL[bound]}`;
};

export const buildBandLabels = (): Record<BandFieldKey, string> => {
  const out: Partial<Record<BandFieldKey, string>> = {};
  for (const band of BANDS) {
    for (const sport of SPORTS) {
      const minHr = `${sport}.heartRateZones.${band}.minBpm` as BandFieldKey;
      const maxHr = `${sport}.heartRateZones.${band}.maxBpm` as BandFieldKey;
      out[minHr] = buildLabel(minHr);
      out[maxHr] = buildLabel(maxHr);
    }
    out[`cycling.powerZones.${band}.minPercent`] = buildLabel(
      `cycling.powerZones.${band}.minPercent` as BandFieldKey
    );
    out[`cycling.powerZones.${band}.maxPercent`] = buildLabel(
      `cycling.powerZones.${band}.maxPercent` as BandFieldKey
    );
    for (const sport of ["running", "swimming"] as const) {
      const minPc = `${sport}.paceZones.${band}.minPace` as BandFieldKey;
      const maxPc = `${sport}.paceZones.${band}.maxPace` as BandFieldKey;
      out[minPc] = buildLabel(minPc);
      out[maxPc] = buildLabel(maxPc);
    }
  }
  return out as Record<BandFieldKey, string>;
};

export const buildBandUnits = (): Record<BandFieldKey, string> => {
  const out: Partial<Record<BandFieldKey, string>> = {};
  for (const band of BANDS) {
    for (const sport of SPORTS) {
      out[`${sport}.heartRateZones.${band}.minBpm`] = "bpm";
      out[`${sport}.heartRateZones.${band}.maxBpm`] = "bpm";
    }
    out[`cycling.powerZones.${band}.minPercent`] = "% FTP";
    out[`cycling.powerZones.${band}.maxPercent`] = "% FTP";
    out[`running.paceZones.${band}.minPace`] = "/km";
    out[`running.paceZones.${band}.maxPace`] = "/km";
    out[`swimming.paceZones.${band}.minPace`] = "/100m";
    out[`swimming.paceZones.${band}.maxPace`] = "/100m";
  }
  return out as Record<BandFieldKey, string>;
};
