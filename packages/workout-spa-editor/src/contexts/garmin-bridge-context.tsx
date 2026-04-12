import type { ReactNode } from "react";
import { createContext, useContext } from "react";

import { useGarminBridgeActions } from "../hooks/use-garmin-bridge-actions";
import type { GarminBridgeState } from "./garmin-bridge-types";

const GarminBridgeContext = createContext<GarminBridgeState | null>(null);

export const GarminBridgeProvider = ({ children }: { children: ReactNode }) => {
  const state = useGarminBridgeActions();

  return (
    <GarminBridgeContext.Provider value={state}>
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
