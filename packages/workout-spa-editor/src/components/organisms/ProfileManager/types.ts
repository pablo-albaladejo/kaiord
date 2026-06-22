import type { ActivityLevel, BiologicalSex } from "../../../types/profile";

export type ProfileFormData = {
  name: string;
  bodyWeight?: number;
  height?: number;
  birthDate?: string;
  sex?: BiologicalSex;
  restingHeartRate?: number;
  activityLevel?: ActivityLevel;
};
