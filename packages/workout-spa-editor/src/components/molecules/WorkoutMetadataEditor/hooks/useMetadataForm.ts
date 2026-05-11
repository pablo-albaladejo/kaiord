/**
 * useMetadataForm Hook
 *
 * Form state management for workout metadata.
 */

import { useState } from "react";

import type { KRD, Sport, SubSport } from "../../../../types/krd";
import { getStructuredWorkout } from "../../../../utils/structured-workout";

export function useMetadataForm(krd: KRD) {
  const structured = getStructuredWorkout(krd);
  const workoutName =
    typeof structured?.name === "string" ? structured.name : undefined;
  const workoutSport: Sport =
    typeof structured?.sport === "string"
      ? (structured.sport as Sport)
      : "cycling";
  const workoutSubSport: SubSport =
    typeof structured?.subSport === "string"
      ? (structured.subSport as SubSport)
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
