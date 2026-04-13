import type { ReactNode } from "react";
import { createContext, useContext, useMemo } from "react";

import { useGarminBridgeActions } from "../hooks/use-garmin-bridge-actions";
import type { GarminBridgeState } from "./garmin-bridge-types";

const GarminBridgeContext = createContext<GarminBridgeState | null>(null);

export const GarminBridgeProvider = ({ children }: { children: ReactNode }) => {
  const state = useGarminBridgeActions();

  const value = useMemo(
    () => state,
    [
      state.extensionInstalled,
      state.sessionActive,
      state.pushing,
      state.lastError,
    ]
  );

  return (
    <GarminBridgeContext.Provider value={value}>
      {children}
    </GarminBridgeContext.Provider>
  );
};

export const useGarminBridge = (): GarminBridgeState => {
  const ctx = useContext(GarminBridgeContext);
  if (!ctx) {
    throw new Error("useGarminBridge must be used within GarminBridgeProvider");
  }
  return ctx;
};
