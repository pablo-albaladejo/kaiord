/**
 * The active athlete's profile, for components that need training thresholds
 * to resolve a target into a zone.
 *
 * A calendar week renders tens of cards and every one of them needs the same
 * FTP / LTHR / threshold pace. Reading them per card would mean one live query
 * per card; the page already runs exactly one, so it publishes the result here
 * instead. Consumers that render outside a provider (storybook, unit tests)
 * fall back to `null`, which `thresholdsForSport` answers with `{}` — targets
 * expressed in `zone` or `percent_ftp` still classify, absolute watts do not.
 */
import { createContext, type ReactNode, useContext } from "react";

import type { Profile } from "../types/profile";

const AthleteZonesContext = createContext<Profile | null>(null);

export type AthleteZonesProviderProps = {
  profile: Profile | null;
  children: ReactNode;
};

export function AthleteZonesProvider({
  profile,
  children,
}: AthleteZonesProviderProps) {
  return (
    <AthleteZonesContext.Provider value={profile}>
      {children}
    </AthleteZonesContext.Provider>
  );
}

export const useAthleteZones = (): Profile | null =>
  useContext(AthleteZonesContext);
