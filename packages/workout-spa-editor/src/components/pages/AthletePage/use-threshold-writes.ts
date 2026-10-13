import { useState } from "react";

import { updateProfile } from "../../../application/profile/update-profile";
import { updateSportThresholds } from "../../../application/profile/zones/update-sport-thresholds";
import { usePersistence } from "../../../contexts/persistence-context";
import { useToastContext } from "../../../contexts/ToastContext";
import { useTranslate } from "../../../i18n/use-translate";
import { sportPaceBase, type ThresholdFieldId } from "../../../lib/athlete";
import type { SportKey } from "../../../types/sport-zones";

/** Writes one threshold field and says when it landed. A threshold goes
    through `updateSportThresholds`, so the sport's derived zones follow it;
    the max heart rate is a profile field. */
export function useThresholdWrites(profileId: string, sport: SportKey) {
  const persistence = usePersistence();
  const toast = useToastContext();
  const t = useTranslate("zones");
  const [saved, setSaved] = useState(false);

  const track = (write: Promise<unknown>) => {
    setSaved(false);
    void write.then(
      () => setSaved(true),
      () => toast.error(t("toast.updateFailed"))
    );
  };

  const write = (id: ThresholdFieldId, value: number | undefined) => {
    if (id === "maxHeartRate") {
      track(updateProfile(persistence, profileId, { maxHeartRate: value }));
      return;
    }
    track(
      updateSportThresholds(persistence, profileId, sport, (current) => ({
        ...current,
        ...(id === "thresholdPace" && {
          paceUnit: current.paceUnit ?? sportPaceBase(sport),
        }),
        [id]: value,
      }))
    );
  };

  return { saved, write };
}
