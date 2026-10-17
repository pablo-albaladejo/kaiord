/** The fields `summarizeHealth` may copy out of each metric's KRD payload. */
import type { HealthMetric } from "./profile-readers";

export const NUMERIC_FIELDS: Record<HealthMetric, readonly string[]> = {
  sleep: ["totalDurationSeconds", "score", "restingHeartRate"],
  weight: ["weightKilograms"],
  hrv: ["rMSSD", "score"],
  "daily-wellness": [
    "steps",
    "activeCalories",
    "restingCalories",
    "floorsClimbed",
  ],
  "body-composition": [
    "bodyFatPercent",
    "leanMassKilograms",
    "boneMassKilograms",
    "bodyWaterPercent",
    "bmi",
    "visceralFatRating",
    "basalMetabolicRateKcal",
  ],
  stress: ["averageLevel", "peakLevel"],
};

export const SLEEP_STAGES = ["awake", "light", "deep", "rem"] as const;
export const HRV_WINDOWS: readonly string[] = ["overnight", "spot"];
