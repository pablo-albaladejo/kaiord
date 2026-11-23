/**
 * Band-level FieldKey labels and unit cross-products. A label is composed
 * from dictionary parts (`zones:conflict.band*`); it never interpolates an
 * external string.
 */
import type { Translate } from "../../../i18n/use-translate";
import type { BandFieldKey } from "../../../types/coaching-zones";

const SPORTS = ["cycling", "running", "swimming"] as const;
const BANDS = ["z1", "z2", "z3", "z4", "z5"] as const;

export const bandLabel = (field: BandFieldKey, t: Translate): string => {
  const [sport, kind, band, bound] = field.split(".") as [
    string,
    string,
    string,
    string,
  ];
  return t("conflict.band", {
    sport: t(`conflict.sport.${sport}`),
    kind: t(`conflict.bandKind.${kind}`),
    zone: band.toUpperCase(),
    bound: t(`conflict.bound.${bound.startsWith("min") ? "min" : "max"}`),
  });
};

export const buildBandFieldKeys = (): BandFieldKey[] => {
  const out: BandFieldKey[] = [];
  for (const band of BANDS) {
    for (const sport of SPORTS)
      out.push(
        `${sport}.heartRateZones.${band}.minBpm`,
        `${sport}.heartRateZones.${band}.maxBpm`
      );
    out.push(
      `cycling.powerZones.${band}.minPercent`,
      `cycling.powerZones.${band}.maxPercent`
    );
    for (const sport of ["running", "swimming"] as const)
      out.push(
        `${sport}.paceZones.${band}.minPace`,
        `${sport}.paceZones.${band}.maxPace`
      );
  }
  return out;
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
