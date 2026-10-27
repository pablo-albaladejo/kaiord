import type { Analytics } from "@kaiord/core";
import { StrictMode } from "react";
import { Router } from "wouter";

import App from "./App.tsx";
import { StaleSchemaGate } from "./components/organisms/StaleSchemaDialog/StaleSchemaGate";
import {
  AnalyticsProvider,
  GarminBridgeProvider,
  ThemeProvider,
} from "./contexts";
import { CoachMoveNoticeProvider } from "./contexts/coach-move-notice-context";
import { CoachingRegistryBootstrap } from "./contexts/coaching-registry-bootstrap";
import { PersistenceProvider } from "./contexts/persistence-context";
import { PlacementOutcomeProvider } from "./contexts/placement-outcome-context";
import { SyncProvider } from "./contexts/sync-context";
import { UnitsProvider } from "./contexts/units-context";
import { LocaleProvider } from "./i18n/LocaleProvider";
import { getDeviceId } from "./lib/cloud-sync/device-id";
import { useFragmentLocation } from "./lib/fragment-location";
import type { CloudSyncPort } from "./ports/cloud-sync-port";
import type { PersistencePort } from "./ports/persistence-port";
import type { SnapshotPort } from "./ports/snapshot-port";

export type AppRootProps = {
  analytics: Analytics;
  persistence: PersistencePort;
  cloudSync: CloudSyncPort;
  snapshotPort: SnapshotPort;
  afterImport: () => Promise<void>;
};

export const AppRoot = (props: AppRootProps) => (
  <StrictMode>
    <AnalyticsProvider analytics={props.analytics}>
      <PersistenceProvider persistence={props.persistence}>
        <SyncProvider
          cloud={props.cloudSync}
          snapshotPort={props.snapshotPort}
          deviceId={getDeviceId()}
          afterImport={props.afterImport}
        >
          <ThemeProvider defaultTheme="dark">
            <GarminBridgeProvider>
              <PlacementOutcomeProvider>
                <CoachMoveNoticeProvider>
                  <CoachingRegistryBootstrap>
                    <LocaleProvider>
                      <UnitsProvider>
                        <StaleSchemaGate />
                        <Router hook={useFragmentLocation}>
                          <App />
                        </Router>
                      </UnitsProvider>
                    </LocaleProvider>
                  </CoachingRegistryBootstrap>
                </CoachMoveNoticeProvider>
              </PlacementOutcomeProvider>
            </GarminBridgeProvider>
          </ThemeProvider>
        </SyncProvider>
      </PersistenceProvider>
    </AnalyticsProvider>
  </StrictMode>
);
