import { render, type RenderOptions } from "@testing-library/react";
import React, { type ReactElement } from "react";

import { AppToastProvider } from "./components/providers/AppToastProvider";
import { CoachingRegistryProvider } from "./contexts/coaching-registry-context";
import { GarminBridgeProvider } from "./contexts/garmin-bridge-context";
import { PersistenceProvider } from "./contexts/persistence-context";
import { SyncProvider } from "./contexts/sync-context";
import { type Theme, ThemeProvider } from "./contexts/ThemeContext";
import type { CloudSyncPort } from "./ports/cloud-sync-port";
import type { PersistencePort } from "./ports/persistence-port";
import type { SnapshotPort } from "./ports/snapshot-port";
import { createInMemoryCloudSyncPort } from "./test-utils/in-memory-cloud-sync-port";
import { createInMemoryPersistence } from "./test-utils/in-memory-persistence";
import { createInMemorySnapshotPort } from "./test-utils/in-memory-snapshot-port";

const EMPTY_SNAPSHOT_SCHEMA_VERSION = 19;

/**
 * Options for renderWithProviders.
 *
 * `persistence` defaults to `createInMemoryPersistence()` for tests
 * that don't depend on `useLiveQuery` reactivity. Tests that exercise
 * Dexie-backed live hooks SHOULD pass `createDexiePersistence(db)`
 * (the production singleton, fake-indexeddb-backed in jsdom).
 *
 * The default `snapshotPort` is a standalone EMPTY in-memory store — it is
 * NOT backed by `persistence`. Tests that actually exercise cloud sync MUST
 * pass a `snapshotPort` (and `cloud`) wired to the same store/db as
 * `persistence`, e.g. `createDexieSnapshotPort(db)` alongside
 * `createDexiePersistence(db)`.
 */
export type RenderWithProvidersOptions = Omit<RenderOptions, "wrapper"> & {
  defaultTheme?: Theme;
  persistence?: PersistencePort;
  cloud?: CloudSyncPort;
  snapshotPort?: SnapshotPort;
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
    cloud = createInMemoryCloudSyncPort(),
    snapshotPort = createInMemorySnapshotPort({
      schemaVersion: EMPTY_SNAPSHOT_SCHEMA_VERSION,
      tables: {},
      tombstones: [],
    }),
    ...renderOptions
  } = options ?? {};
  const Wrapper = ({ children }: { children: React.ReactNode }) => {
    return (
      <ThemeProvider defaultTheme={defaultTheme}>
        <PersistenceProvider persistence={persistence}>
          <SyncProvider
            cloud={cloud}
            snapshotPort={snapshotPort}
            deviceId="test-device"
          >
            <GarminBridgeProvider>
              <CoachingRegistryProvider factories={[]}>
                <AppToastProvider>{children}</AppToastProvider>
              </CoachingRegistryProvider>
            </GarminBridgeProvider>
          </SyncProvider>
        </PersistenceProvider>
      </ThemeProvider>
    );
  };

  return render(ui, { wrapper: Wrapper, ...renderOptions });
}

export * from "@testing-library/react";
export { default as userEvent } from "@testing-library/user-event";
