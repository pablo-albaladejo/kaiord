/**
 * UnitsContext — single source of this device's measurement system for
 * display. Reads the device `units` preference once at the root so
 * the many render-time formatters (step cards, thresholds, weight) do not
 * each subscribe to it. Absent preference (or no provider) defaults
 * to `metric`, matching the display-only conversion contract.
 */

import { createContext, type ReactNode, useContext } from "react";

import { useDevicePreferences } from "../hooks/use-device-preferences";
import type { Units } from "../types/user-preferences";

export type { Units };

const UnitsContext = createContext<Units | undefined>(undefined);

export const UnitsProvider = ({ children }: { children: ReactNode }) => {
  const units: Units = useDevicePreferences().prefs.units ?? "metric";

  return (
    <UnitsContext.Provider value={units}>{children}</UnitsContext.Provider>
  );
};

/** Active measurement system; defaults to `metric` outside a provider. */
export const useUnits = (): Units => useContext(UnitsContext) ?? "metric";
