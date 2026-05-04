/**
 * Parse a band-level FieldKey into its components. Returns null for
 * threshold-scalar keys (the legacy 7).
 */
import type { FieldKey } from "../../types/coaching-zones";
import type {
  Band,
  HrBound,
  PaceBound,
  PowerBound,
  Sport,
} from "./sync-zones-band-fields";

export type ParsedBandKey =
  | { kind: "hr"; sport: Sport; band: Band; bound: HrBound }
  | { kind: "power"; band: Band; bound: PowerBound }
  | {
      kind: "pace";
      sport: "running" | "swimming";
      band: Band;
      bound: PaceBound;
    }
  | null;

const HR_BAND_RE =
  /^(cycling|running|swimming)\.heartRateZones\.(z[1-5])\.(minBpm|maxBpm)$/;
const POWER_BAND_RE = /^cycling\.powerZones\.(z[1-5])\.(minPercent|maxPercent)$/;
const PACE_BAND_RE =
  /^(running|swimming)\.paceZones\.(z[1-5])\.(minPace|maxPace)$/;

export const parseBandKey = (field: FieldKey): ParsedBandKey => {
  const hr = HR_BAND_RE.exec(field);
  if (hr) {
    return {
      kind: "hr",
      sport: hr[1] as Sport,
      band: hr[2] as Band,
      bound: hr[3] as HrBound,
    };
  }
  const pw = POWER_BAND_RE.exec(field);
  if (pw) {
    return { kind: "power", band: pw[1] as Band, bound: pw[2] as PowerBound };
  }
  const pace = PACE_BAND_RE.exec(field);
  if (pace) {
    return {
      kind: "pace",
      sport: pace[1] as "running" | "swimming",
      band: pace[2] as Band,
      bound: pace[3] as PaceBound,
    };
  }
  return null;
};
