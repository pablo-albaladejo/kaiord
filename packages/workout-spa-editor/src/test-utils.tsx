import { render, type RenderOptions } from "@testing-library/react";
import React, { type ReactElement } from "react";

import { AppToastProvider } from "./components/providers/AppToastProvider";
import { CoachingRegistryProvider } from "./contexts/coaching-registry-context";
import { GarminBridgeProvider } from "./contexts/garmin-bridge-context";
import { PersistenceProvider } from "./contexts/persistence-context";
import { SettingsDialogProvider } from "./contexts/settings-dialog-context";
import { type Theme, ThemeProvider } from "./contexts/ThemeContext";
import type { PersistencePort } from "./ports/persistence-port";
import { createInMemoryPersistence } from "./test-utils/in-memory-persistence";

/**
 * Options for renderWithProviders.
 *
 * `persistence` defaults to `createInMemoryPersistence()` for tests
 * that don't depend on `useLiveQuery` reactivity. Tests that exercise
 * Dexie-backed live hooks SHOULD pass `createDexiePersistence(db)`
 * (the production singleton, fake-indexeddb-backed in jsdom).
 */
export type RenderWithProvidersOptions = Omit<RenderOptions, "wrapper"> & {
  defaultTheme?: Theme;
  persistence?: PersistencePort;
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
  const {
    defaultTheme,
    persistence = createInMemoryPersistence(),
    ...renderOptions
  } = options ?? {};
  const Wrapper = ({ children }: { children: React.ReactNode }) => {
    return (
      <ThemeProvider defaultTheme={defaultTheme}>
        <PersistenceProvider persistence={persistence}>
          <SettingsDialogProvider>
            <GarminBridgeProvider>
              <CoachingRegistryProvider factories={[]}>
                <AppToastProvider>{children}</AppToastProvider>
              </CoachingRegistryProvider>
            </GarminBridgeProvider>
          </SettingsDialogProvider>
        </PersistenceProvider>
      </ThemeProvider>
    );
  };

  return render(ui, { wrapper: Wrapper, ...renderOptions });
}

export * from "@testing-library/react";
export { default as userEvent } from "@testing-library/user-event";
