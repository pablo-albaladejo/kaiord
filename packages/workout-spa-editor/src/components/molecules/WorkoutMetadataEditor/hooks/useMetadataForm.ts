/**
 * useMetadataForm Hook
 *
 * Form state management for workout metadata.
 */

import { useState } from "react";
import type { KRD, Sport, SubSport } from "../../../../types/krd";

export function useMetadataForm(krd: KRD) {
  const workoutData = krd.extensions?.structured_workout;
  const workoutName =
    workoutData &&
    typeof workoutData === "object" &&
    "name" in workoutData &&
    typeof workoutData.name === "string"
      ? workoutData.name
      : undefined;
  const workoutSport =
    workoutData &&
    typeof workoutData === "object" &&
    "sport" in workoutData &&
    typeof workoutData.sport === "string"
      ? (workoutData.sport as Sport)
      : "cycling";
  const workoutSubSport =
    workoutData &&
    typeof workoutData === "object" &&
    "subSport" in workoutData &&
    typeof workoutData.subSport === "string"
      ? (workoutData.subSport as SubSport)
      : "generic";

  const [name, setName] = useState(workoutName || "");
  const [sport, setSport] = useState<Sport>(workoutSport);
  const [subSport, setSubSport] = useState<SubSport>(workoutSubSport);

  const handleSportChange = (newSport: Sport) => {
    setSport(newSport);
    setSubSport("generic");
  };

  return {
    name,
    sport,
    subSport,
    setName,
    setSport: handleSportChange,
    setSubSport,
  };
}
