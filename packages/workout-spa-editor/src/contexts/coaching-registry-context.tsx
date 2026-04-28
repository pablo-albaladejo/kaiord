/**
 * CoachingRegistry — React context that aggregates coaching source factories.
 *
 * Holds an array of CoachingSourceFactory (hooks). Consumers
 * (useCoachingActivities) invoke each factory with the current
 * (activeProfileId, days) to materialize a CoachingSource per render.
 */

import type { ReactNode } from "react";
import { createContext, useContext } from "react";

import type { CoachingSourceFactory } from "../types/coaching-source";

type CoachingRegistryValue = {
  factories: CoachingSourceFactory[];
};

const CoachingRegistryContext = createContext<CoachingRegistryValue>({
  factories: [],
});

export type CoachingRegistryProviderProps = {
  factories: CoachingSourceFactory[];
  children: ReactNode;
};

export function CoachingRegistryProvider({
  factories,
  children,
}: CoachingRegistryProviderProps) {
  return (
    <CoachingRegistryContext.Provider value={{ factories }}>
      {children}
    </CoachingRegistryContext.Provider>
  );
}

export const useCoachingSourceFactories = (): CoachingSourceFactory[] =>
  useContext(CoachingRegistryContext).factories;
