/**
 * Threshold-scalar FieldKey accessors (the legacy 7 keys). Band-level
 * keys are handled separately in `sync-zones-band-fields.ts` /
 * `sync-zones-band-writes.ts`.
 */
import type { ThresholdFieldKey } from "../../types/coaching-zones";
import type { Profile } from "../../types/profile";

export const readThreshold = (
  profile: Profile,
  field: ThresholdFieldKey
): number | undefined => {
  switch (field) {
    case "bodyWeight":
      return profile.bodyWeight;
    case "heartRate.max":
      return profile.maxHeartRate;
    case "cycling.thresholds.ftp":
      return profile.sportZones.cycling?.thresholds.ftp;
    case "cycling.thresholds.lthr":
      return profile.sportZones.cycling?.thresholds.lthr;
    case "running.thresholds.lthr":
      return profile.sportZones.running?.thresholds.lthr;
    case "running.thresholds.thresholdPaceSecPerKm":
      return profile.sportZones.running?.thresholds.thresholdPace;
    case "swimming.thresholds.cssPaceSecPer100m":
      return profile.sportZones.swimming?.thresholds.thresholdPace;
  }
};

const setSportThreshold = (
  profile: Profile,
  sport: "cycling" | "running" | "swimming",
  patch: { ftp?: number; lthr?: number; thresholdPace?: number }
): Profile => {
  const existing = profile.sportZones[sport];
  const thresholds = { ...(existing?.thresholds ?? {}), ...patch };
  const sportConfig = existing
    ? { ...existing, thresholds }
    : { thresholds, heartRateZones: { method: "custom", zones: [] } };
  return {
    ...profile,
    sportZones: { ...profile.sportZones, [sport]: sportConfig },
  };
};

export const writeThreshold = (
  profile: Profile,
  field: ThresholdFieldKey,
  value: number
): Profile => {
  switch (field) {
    case "bodyWeight":
      return { ...profile, bodyWeight: value };
    case "heartRate.max":
      return { ...profile, maxHeartRate: value };
    case "cycling.thresholds.ftp":
      return setSportThreshold(profile, "cycling", { ftp: value });
    case "cycling.thresholds.lthr":
      return setSportThreshold(profile, "cycling", { lthr: value });
    case "running.thresholds.lthr":
      return setSportThreshold(profile, "running", { lthr: value });
    case "running.thresholds.thresholdPaceSecPerKm":
      return setSportThreshold(profile, "running", { thresholdPace: value });
    case "swimming.thresholds.cssPaceSecPer100m":
      return setSportThreshold(profile, "swimming", { thresholdPace: value });
  }
};
