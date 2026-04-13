/**
 * CoachingRegistry — React context that aggregates coaching sources.
 *
 * Provides all registered CoachingSources to the component tree.
 * Platform adapters register via the provider. Consumers use
 * useCoachingSources() to access the aggregated data.
 */

import type { ReactNode } from "react";
import { createContext, useContext } from "react";

import type { CoachingSource } from "../types/coaching-source";

type CoachingRegistryValue = {
  sources: CoachingSource[];
};

const CoachingRegistryContext = createContext<CoachingRegistryValue>({
  sources: [],
});

export type CoachingRegistryProviderProps = {
  sources: CoachingSource[];
  children: ReactNode;
};

export function CoachingRegistryProvider({
  sources,
  children,
}: CoachingRegistryProviderProps) {
  return (
    <CoachingRegistryContext.Provider value={{ sources }}>
      {children}
    </CoachingRegistryContext.Provider>
  );
}

export const useCoachingSources = (): CoachingSource[] =>
  useContext(CoachingRegistryContext).sources;
