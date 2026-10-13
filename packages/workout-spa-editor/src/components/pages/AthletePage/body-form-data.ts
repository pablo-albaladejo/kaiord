import type { ActivityLevel, BiologicalSex } from "../../../types/profile";

/** The Body section's personal data. The weight is not here: it is the
    current weight, recorded as a weigh-in. */
export type BodyFormData = {
  height?: number;
  birthDate?: string;
  sex?: BiologicalSex;
  restingHeartRate?: number;
  activityLevel?: ActivityLevel;
};
