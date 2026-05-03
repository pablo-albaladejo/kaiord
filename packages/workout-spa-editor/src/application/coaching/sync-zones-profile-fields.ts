/**
 * `FieldKey` ↔ `Profile` field accessors.
 *
 * `FieldKey` is the logical contract used by the use case + UI; the
 * actual storage paths are an implementation detail. These helpers
 * encapsulate that mapping so adding a new `FieldKey` is a single-file
 * change (here + the union in `coaching-zones.ts`).
 */
import type { FieldKey } from "../../types/coaching-zones";
import type { Profile } from "../../types/profile";

export const readField = (
  profile: Profile,
  field: FieldKey
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
    : {
        thresholds,
        heartRateZones: { method: "manual", zones: [] },
      };
  return {
    ...profile,
    sportZones: { ...profile.sportZones, [sport]: sportConfig },
  };
};

export const writeField = (
  profile: Profile,
  field: FieldKey,
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
