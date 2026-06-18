/**
 * UnitsContext — single source of the active profile's measurement system
 * for display. Reads the per-profile `units` preference once at the root so
 * the many render-time formatters (step cards, thresholds, weight) do not
 * each open a Dexie live query. Absent preference (or no provider) defaults
 * to `metric`, matching the display-only conversion contract.
 */

import { createContext, type ReactNode, useContext } from "react";

import { useActiveProfileLive } from "../hooks/use-active-profile-live";
import { useUserPreferences } from "../hooks/use-user-preferences";
import type { Units } from "../types/user-preferences";

export type { Units };

const UnitsContext = createContext<Units | undefined>(undefined);

export const UnitsProvider = ({ children }: { children: ReactNode }) => {
  const active = useActiveProfileLive();
  const prefs = useUserPreferences({
    profileId: active?.id ?? null,
    defaultView: "grid",
  });
  const units: Units = prefs?.units ?? "metric";

  return (
    <UnitsContext.Provider value={units}>{children}</UnitsContext.Provider>
  );
};

/** Active measurement system; defaults to `metric` outside a provider. */
export const useUnits = (): Units => useContext(UnitsContext) ?? "metric";
