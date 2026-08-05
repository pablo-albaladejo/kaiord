import { useCallback } from "react";

import { updateProfile } from "../../application/profile/update-profile";
import { updateSportThresholds } from "../../application/profile/zones/update-sport-thresholds";
import { usePersistence } from "../../contexts/persistence-context";
import type { ActiveSport } from "../../lib/athlete";
import type { ThresholdFieldKey } from "../../types/coaching-zones";
import type { SportThresholds } from "../../types/sport-zones";

const patchFor = (
  field: ThresholdFieldKey,
  value: number
): SportThresholds | null => {
  if (field.endsWith(".ftp")) return { ftp: value };
  if (field.endsWith(".lthr")) return { lthr: value };
  if (field === "running.thresholds.thresholdPaceSecPerKm") {
    return { thresholdPace: value, paceUnit: "min_per_km" };
  }
  if (field === "swimming.thresholds.cssPaceSecPer100m") {
    return { thresholdPace: value, paceUnit: "min_per_100m" };
  }
  return null;
};

/**
 * Writes a single threshold, routed by its `ThresholdFieldKey`.
 *
 * Sport thresholds go through `updateSportThresholds` so the derived zone
 * tables are recalculated with the new number — the same path the zone editor
 * takes. `heartRate.max` is a profile-level field and has its own use case.
 */
export function useApplyThreshold(profileId: string, sport: ActiveSport) {
  const persistence = usePersistence();

  return useCallback(
    async (field: ThresholdFieldKey, value: number): Promise<void> => {
      if (field === "heartRate.max") {
        await updateProfile(persistence, profileId, { maxHeartRate: value });
        return;
      }
      const patch = patchFor(field, value);
      if (!patch) return;
      const profile = await persistence.profiles.getById(profileId);
      await updateSportThresholds(persistence, profileId, sport, {
        ...profile?.sportZones[sport]?.thresholds,
        ...patch,
      });
    },
    [persistence, profileId, sport]
  );
}
