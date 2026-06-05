import { useState } from "react";

import { type ActiveSport, ATHLETE_SPORTS } from "../../../lib/athlete";
import type { Profile } from "../../../types/profile";
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
  const [sport, setSport] = useState<ActiveSport>(() => defaultSport(profile));
  const sportLabel =
    ATHLETE_SPORTS.find((option) => option.value === sport)?.label ?? "";

  return (
    <div className="space-y-5 px-4 py-4">
      <AthleteIdentity profile={profile} />
      <Segmented
        options={[...ATHLETE_SPORTS]}
        value={sport}
        onChange={setSport}
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
