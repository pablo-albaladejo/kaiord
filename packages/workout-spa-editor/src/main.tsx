import "./index.css";

import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { Router } from "wouter";

import { createUmamiAnalytics } from "./adapters/analytics/umami-analytics";
import { withEncryption } from "./adapters/cloud-sync/encrypting-cloud-sync";
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
import { UnitsProvider } from "./contexts/units-context";
import { LocaleProvider } from "./i18n/LocaleProvider";
import { reloadOnceForChunkError } from "./lib/chunk-reload";
import { getDeviceId } from "./lib/cloud-sync/device-id";
import { getSyncPassphrase } from "./lib/cloud-sync/encryption-runtime";
import { isEncryptionEnabled } from "./lib/cloud-sync/sync-encryption-pref";
import { getUmamiWebsiteId } from "./lib/runtime-config";
import { computeRouterBase } from "./router-base";

// Recover from stale lazy chunks after a deploy: Vite fires `vite:preloadError`
// when a hashed chunk can no longer be fetched; reload once to pull the fresh
// build (loop-guarded). See `lib/chunk-reload`.
window.addEventListener("vite:preloadError", (event) => {
  event.preventDefault();
  reloadOnceForChunkError();
});

const analytics = createUmamiAnalytics(getUmamiWebsiteId());

const persistence = createDexiePersistence();

const cloudSync = withEncryption(createGoogleDriveCloudSync(), {
  isEnabled: isEncryptionEnabled,
  getPassphrase: getSyncPassphrase,
});
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
          <ThemeProvider defaultTheme="dark">
            <GarminBridgeProvider>
              <CoachingRegistryBootstrap>
                <LocaleProvider>
                  <UnitsProvider>
                    <Router base={routerBase}>
                      <App />
                    </Router>
                  </UnitsProvider>
                </LocaleProvider>
              </CoachingRegistryBootstrap>
            </GarminBridgeProvider>
          </ThemeProvider>
        </SyncProvider>
      </PersistenceProvider>
    </AnalyticsProvider>
  </StrictMode>
);
