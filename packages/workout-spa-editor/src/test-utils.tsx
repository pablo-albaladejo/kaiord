import { render, type RenderOptions } from "@testing-library/react";
import React, { type ReactElement } from "react";

import { ToastProvider } from "./components/atoms/Toast";
import { CoachingRegistryProvider } from "./contexts/coaching-registry-context";
import { GarminBridgeProvider } from "./contexts/garmin-bridge-context";
import { SettingsDialogProvider } from "./contexts/settings-dialog-context";
import { type Theme, ThemeProvider } from "./contexts/ThemeContext";
import { ToastContextProvider } from "./contexts/ToastContext";

/**
 * Options for renderWithProviders
 */
export type RenderWithProvidersOptions = Omit<RenderOptions, "wrapper"> & {
  defaultTheme?: Theme;
};

/**
 * Custom render function that wraps components with necessary providers
 * Includes ThemeProvider for components that use theme context
 * Includes ToastContextProvider for components that use toast notifications
 */
export function renderWithProviders(
  ui: ReactElement,
  options?: RenderWithProvidersOptions
) {
  const { defaultTheme, ...renderOptions } = options ?? {};
  const Wrapper = ({ children }: { children: React.ReactNode }) => {
    return (
      <ThemeProvider defaultTheme={defaultTheme}>
        <SettingsDialogProvider>
          <GarminBridgeProvider>
            <CoachingRegistryProvider sources={[]}>
              <ToastProvider>
                <ToastContextProvider>{children}</ToastContextProvider>
              </ToastProvider>
            </CoachingRegistryProvider>
          </GarminBridgeProvider>
        </SettingsDialogProvider>
      </ThemeProvider>
    );
  };

  return render(ui, { wrapper: Wrapper, ...renderOptions });
}

// Re-export everything from React Testing Library
export * from "@testing-library/react";
export { default as userEvent } from "@testing-library/user-event";
