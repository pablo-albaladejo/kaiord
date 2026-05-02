import type { ReactNode } from "react";
import { createContext, useContext, useMemo } from "react";

import { useGarminBridgeActions } from "../hooks/use-garmin-bridge-actions";
import type { GarminBridgeState } from "./garmin-bridge-types";

const GarminBridgeContext = createContext<GarminBridgeState | null>(null);

export const GarminBridgeProvider = ({ children }: { children: ReactNode }) => {
  const state = useGarminBridgeActions();

  // TODO(fix-coaching-dialog-rules-of-hooks-followup): explicit field
  // dependencies are deliberate — the store mutates `state` in place
  // and we only want to re-render on the listed slices.
  /* eslint-disable react-hooks/exhaustive-deps */
  const value = useMemo(
    () => state,
    [
      state.extensionInstalled,
      state.sessionActive,
      state.pushing,
      state.lastError,
    ]
  );
  /* eslint-enable react-hooks/exhaustive-deps */

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
