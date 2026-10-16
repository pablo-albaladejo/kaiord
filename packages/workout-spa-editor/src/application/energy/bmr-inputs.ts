/**
 * The fields BMR estimation needs: height, birth date and sex from the
 * profile, and the athlete's current weight (latest weigh-in, else
 * `profile.bodyWeight`). `null` when any of them is unknown, so callers
 * never show a basal-derived number they cannot honestly compute.
 */
import type { Profile } from "../../types/profile";
import { getCurrentWeightKg } from "../health/current-weight";
import type { DayEnergySources } from "./load-day-energy-sources";

export type BmrInputs = {
  profile: Profile & {
    height: number;
    birthDate: string;
    sex: NonNullable<Profile["sex"]>;
  };
  weightKg: number;
};

export const resolveBmrInputs = (
  sources: Pick<DayEnergySources, "profile" | "latestWeight">
): BmrInputs | null => {
  const { profile, latestWeight } = sources;
  const weightKg = getCurrentWeightKg(profile, latestWeight);
  if (
    profile?.height === undefined ||
    profile.birthDate === undefined ||
    profile.sex === undefined ||
    weightKg === undefined
  ) {
    return null;
  }
  return {
    profile: {
      ...profile,
      height: profile.height,
      birthDate: profile.birthDate,
      sex: profile.sex,
    },
    weightKg,
  };
};
