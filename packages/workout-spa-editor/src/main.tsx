import "./index.css";

import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import { createCloudflareAnalytics } from "./adapters/analytics/cloudflare-analytics";
import App from "./App.tsx";
import {
  AnalyticsProvider,
  GarminBridgeProvider,
  SettingsDialogProvider,
  ThemeProvider,
} from "./contexts";
import { CoachingRegistryBootstrap } from "./contexts/coaching-registry-bootstrap";

const analytics = createCloudflareAnalytics(
  import.meta.env.VITE_CF_ANALYTICS_TOKEN as string | undefined
);

if (import.meta.env.DEV) {
  import("./store/ai-store").then(({ useAiStore }) => {
    (window as unknown as Record<string, unknown>).__ZUSTAND_STORES__ = {
      ai: useAiStore,
    };
  });
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <AnalyticsProvider analytics={analytics}>
      <ThemeProvider>
        <SettingsDialogProvider>
          <GarminBridgeProvider>
            <CoachingRegistryBootstrap>
              <App />
            </CoachingRegistryBootstrap>
          </GarminBridgeProvider>
        </SettingsDialogProvider>
      </ThemeProvider>
    </AnalyticsProvider>
  </StrictMode>
);
