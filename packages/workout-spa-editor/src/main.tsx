import "./index.css";

import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { Router } from "wouter";

import { createCloudflareAnalytics } from "./adapters/analytics/cloudflare-analytics";
import { createGoogleDriveCloudSync } from "./adapters/cloud-sync/google-drive-cloud-sync-adapter";
import { db } from "./adapters/dexie/dexie-database";
import { createDexiePersistence } from "./adapters/dexie/dexie-persistence-adapter";
import { createDexieSnapshotPort } from "./adapters/dexie/dexie-snapshot-port";
import App from "./App.tsx";
import {
  AnalyticsProvider,
  GarminBridgeProvider,
  ThemeProvider,
} from "./contexts";
import { CoachingRegistryBootstrap } from "./contexts/coaching-registry-bootstrap";
import { PersistenceProvider } from "./contexts/persistence-context";
import { SyncProvider } from "./contexts/sync-context";
import { getDeviceId } from "./lib/cloud-sync/device-id";
import { getCfAnalyticsToken } from "./lib/runtime-config";
import { computeRouterBase } from "./router-base";

const analytics = createCloudflareAnalytics(getCfAnalyticsToken());

const persistence = createDexiePersistence();

const cloudSync = createGoogleDriveCloudSync();
const snapshotPort = createDexieSnapshotPort(db);

const routerBase = computeRouterBase(import.meta.env.BASE_URL);

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <AnalyticsProvider analytics={analytics}>
      <PersistenceProvider persistence={persistence}>
        <SyncProvider
          cloud={cloudSync}
          snapshotPort={snapshotPort}
          deviceId={getDeviceId()}
        >
          <ThemeProvider>
            <GarminBridgeProvider>
              <CoachingRegistryBootstrap>
                <Router base={routerBase}>
                  <App />
                </Router>
              </CoachingRegistryBootstrap>
            </GarminBridgeProvider>
          </ThemeProvider>
        </SyncProvider>
      </PersistenceProvider>
    </AnalyticsProvider>
  </StrictMode>
);
