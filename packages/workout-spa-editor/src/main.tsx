import "./index.css";

import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

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

const analytics = createCloudflareAnalytics(
  import.meta.env.VITE_CF_ANALYTICS_TOKEN as string | undefined
);

const persistence = createDexiePersistence();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <AnalyticsProvider analytics={analytics}>
      <PersistenceProvider persistence={persistence}>
        <ThemeProvider>
          <SettingsDialogProvider>
            <GarminBridgeProvider>
              <CoachingRegistryBootstrap>
                <App />
              </CoachingRegistryBootstrap>
            </GarminBridgeProvider>
          </SettingsDialogProvider>
        </ThemeProvider>
      </PersistenceProvider>
    </AnalyticsProvider>
  </StrictMode>
);
