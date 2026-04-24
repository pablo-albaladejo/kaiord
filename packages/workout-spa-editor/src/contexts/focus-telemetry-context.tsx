import { createContext, useContext, useRef } from "react";
import type { ReactNode } from "react";

import {
  defaultFocusTelemetry,
  type FocusTelemetry,
} from "../store/providers/focus-telemetry";

export const FocusTelemetryContext =
  createContext<FocusTelemetry>(defaultFocusTelemetry);

export const useFocusTelemetry = (): FocusTelemetry =>
  useContext(FocusTelemetryContext);

type FocusTelemetryProviderProps = {
  value: FocusTelemetry;
  children: ReactNode;
};

export function FocusTelemetryProvider({
  value,
  children,
}: FocusTelemetryProviderProps) {
  // Task 2.1.d — dev-only ref-stability guard.
  // Warns once per mount if the provider value reference changes between
  // renders, which would invalidate context memoization on every render.
  const prevRef = useRef<FocusTelemetry | null>(null);
  if (import.meta.env.DEV) {
    if (prevRef.current !== null && prevRef.current !== value) {
      console.warn(
        "[FocusTelemetry] provider value changed reference — wrap in useCallback to preserve context memoization"
      );
    }
  }
  prevRef.current = value;

  return (
    <FocusTelemetryContext.Provider value={value}>
      {children}
    </FocusTelemetryContext.Provider>
  );
}
