import "./index.css";

import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { Router } from "wouter";

import { createUmamiAnalytics } from "./adapters/analytics/umami-analytics";
import { createLazyCloudSync } from "./adapters/cloud-sync/lazy-cloud-sync";
import { createAppPersistence } from "./adapters/create-app-persistence";
import { registerDefaultProfileBoot } from "./adapters/dexie/default-profile-boot";
import { db } from "./adapters/dexie/dexie-database";
import { createDexieSnapshotPort } from "./adapters/dexie/dexie-snapshot-port";
import App from "./App.tsx";
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
import { defaultProfileName } from "./i18n/default-profile-name";
import { LocaleProvider } from "./i18n/LocaleProvider";
import { reloadOnceForChunkError } from "./lib/chunk-reload";
import { getDeviceId } from "./lib/cloud-sync/device-id";
import { useFragmentLocation } from "./lib/fragment-location";
import { getUmamiWebsiteId } from "./lib/runtime-config";

// Recover from stale lazy chunks after a deploy: Vite fires `vite:preloadError`
// when a hashed chunk can no longer be fetched; reload once to pull the fresh
// build (loop-guarded). See `lib/chunk-reload`.
window.addEventListener("vite:preloadError", (event) => {
  event.preventDefault();
  reloadOnceForChunkError();
});

const analytics = createUmamiAnalytics(getUmamiWebsiteId());

const persistence = createAppPersistence(db);

// First-run default profile, created before the database serves any other
// operation (see `adapters/dexie/default-profile-boot`).
registerDefaultProfileBoot(db, persistence, () =>
  defaultProfileName(navigator.language)
);

// Drive + encryption load on first sync use, outside the initial JS.
const cloudSync = createLazyCloudSync(() =>
  import("./adapters/cloud-sync/create-app-cloud-sync").then((m) =>
    m.createAppCloudSync()
  )
);
const snapshotPort = createDexieSnapshotPort(db);

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
              <PlacementOutcomeProvider>
                <CoachMoveNoticeProvider>
                  <CoachingRegistryBootstrap>
                    <LocaleProvider>
                      <UnitsProvider>
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
