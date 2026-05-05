import "./index.css";

import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { Router } from "wouter";

import { createCloudflareAnalytics } from "./adapters/analytics/cloudflare-analytics";
import { createDexiePersistence } from "./adapters/dexie/dexie-persistence-adapter";
import App from "./App.tsx";
import {
  AnalyticsProvider,
  GarminBridgeProvider,
  SettingsDialogProvider,
  ThemeProvider,
} from "./contexts";
import { CoachingRegistryBootstrap } from "./contexts/coaching-registry-bootstrap";
import { PersistenceProvider } from "./contexts/persistence-context";
import { getCfAnalyticsToken } from "./lib/runtime-config";
import { computeRouterBase } from "./router-base";

// Analytics token is read from runtime config (window.__KAIORD_CONFIG__),
// populated by an inline <script> in index.html whose value is substituted at
// deploy time. The bundle stays environment-agnostic (12-factor III + V).
const analytics = createCloudflareAnalytics(getCfAnalyticsToken());

const persistence = createDexiePersistence();

const routerBase = computeRouterBase(import.meta.env.BASE_URL);

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <AnalyticsProvider analytics={analytics}>
      <PersistenceProvider persistence={persistence}>
        <ThemeProvider>
          <SettingsDialogProvider>
            <GarminBridgeProvider>
              <CoachingRegistryBootstrap>
                <Router base={routerBase}>
                  <App />
                </Router>
              </CoachingRegistryBootstrap>
            </GarminBridgeProvider>
          </SettingsDialogProvider>
        </ThemeProvider>
      </PersistenceProvider>
    </AnalyticsProvider>
  </StrictMode>
);
