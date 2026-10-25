import { createContext, useContext } from "react";

import type { GarminDateDrift } from "../../../application/garmin-placement/garmin-date-drift";
import type { GarminDriftMap } from "../../../hooks/use-week-garmin-drift";

const GarminDriftContext = createContext<GarminDriftMap>(new Map());

export const GarminDriftProvider = GarminDriftContext.Provider;

export const useGarminDriftOf = (
  workoutId: string
): GarminDateDrift | undefined => useContext(GarminDriftContext).get(workoutId);
