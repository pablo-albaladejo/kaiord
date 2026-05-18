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
  ThemeProvider,
} from "./contexts";
import { CoachingRegistryBootstrap } from "./contexts/coaching-registry-bootstrap";
import { PersistenceProvider } from "./contexts/persistence-context";
import { getCfAnalyticsToken } from "./lib/runtime-config";
import { computeRouterBase } from "./router-base";

const analytics = createCloudflareAnalytics(getCfAnalyticsToken());

const persistence = createDexiePersistence();

const routerBase = computeRouterBase(import.meta.env.BASE_URL);

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <AnalyticsProvider analytics={analytics}>
      <PersistenceProvider persistence={persistence}>
        <ThemeProvider>
          <GarminBridgeProvider>
            <CoachingRegistryBootstrap>
              <Router base={routerBase}>
                <App />
              </Router>
            </CoachingRegistryBootstrap>
          </GarminBridgeProvider>
        </ThemeProvider>
      </PersistenceProvider>
    </AnalyticsProvider>
  </StrictMode>
);
