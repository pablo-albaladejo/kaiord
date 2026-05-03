import type { ReactNode } from "react";
import { createContext, useContext, useMemo } from "react";

import { useGarminBridgeActions } from "../hooks/use-garmin-bridge-actions";
import type { GarminBridgeState } from "./garmin-bridge-types";

const GarminBridgeContext = createContext<GarminBridgeState | null>(null);

export const GarminBridgeProvider = ({ children }: { children: ReactNode }) => {
  const state = useGarminBridgeActions();

  // Field-by-field spread so the memo recomputes only when the listed
  // slices change. `useGarminBridgeActions` returns a fresh object literal
  // every render, so we can't depend on `state` itself without losing the
  // memoisation. Methods (detectExtension/pushWorkout/listWorkouts/setPushing)
  // are stable references from useCallback/useState — including them in
  // deps is safe.
  const value = useMemo<GarminBridgeState>(
    () => ({
      extensionInstalled: state.extensionInstalled,
      sessionActive: state.sessionActive,
      pushing: state.pushing,
      lastError: state.lastError,
      detectExtension: state.detectExtension,
      pushWorkout: state.pushWorkout,
      listWorkouts: state.listWorkouts,
      setPushing: state.setPushing,
    }),
    [
      state.extensionInstalled,
      state.sessionActive,
      state.pushing,
      state.lastError,
      state.detectExtension,
      state.pushWorkout,
      state.listWorkouts,
      state.setPushing,
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
