import { useEffect, useState } from "react";

import { useSetUserPreferenceFields } from "../../../hooks/use-set-user-preference-fields";
import { useUserPreferences } from "../../../hooks/use-user-preferences";
import {
  type ActiveSport,
  ATHLETE_SPORTS,
  isActiveSport,
} from "../../../lib/athlete";
import type { Profile } from "../../../types/profile";
import { logger } from "../../../utils/logger";
import { Segmented } from "../../atoms/Segmented";
import { AthleteConnections } from "../../organisms/AthleteConnections";
import { AthleteIdentity } from "./AthleteIdentity";
import { ThresholdCard } from "./ThresholdCard";
import { defaultSport } from "./use-default-sport";
import { ZoneMapCard } from "./ZoneMapCard";

type AthletePageBodyProps = {
  profileId: string;
  profile: Profile;
};

export function AthletePageBody({ profileId, profile }: AthletePageBodyProps) {
  const prefs = useUserPreferences({ profileId, defaultView: "grid" });
  const setPrefs = useSetUserPreferenceFields(profileId);
  const [sport, setSport] = useState<ActiveSport>(() => defaultSport(profile));

  // Seed from the persisted active sport once preferences load, so the
  // selection survives a reload (local state alone reset on every mount).
  useEffect(() => {
    const persisted = prefs?.activeSport;
    if (isActiveSport(persisted)) setSport(persisted);
  }, [prefs?.activeSport]);

  const handleSportChange = (next: ActiveSport) => {
    setSport(next);
    // Best-effort persist; a failed preference write must not surface as an
    // unhandled rejection (the optimistic local state already updated).
    void setPrefs({ activeSport: next }).catch((error: unknown) => {
      logger.warn("Failed to persist active sport", { error });
    });
  };

  const sportLabel =
    ATHLETE_SPORTS.find((option) => option.value === sport)?.label ?? "";

  return (
    <div className="space-y-5 px-4 py-4">
      <AthleteIdentity profile={profile} />
      <Segmented
        options={[...ATHLETE_SPORTS]}
        value={sport}
        onChange={handleSportChange}
        ariaLabel="Sport"
      />
      <ThresholdCard
        profile={profile}
        profileId={profileId}
        sport={sport}
        sportLabel={sportLabel}
      />
      <ZoneMapCard profile={profile} sport={sport} sportLabel={sportLabel} />
      <AthleteConnections profileId={profileId} />
    </div>
  );
}
