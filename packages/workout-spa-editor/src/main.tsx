import "./index.css";

import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import App from "./App.tsx";
import {
  GarminBridgeProvider,
  SettingsDialogProvider,
  ThemeProvider,
} from "./contexts";
import { CoachingRegistryBootstrap } from "./contexts/coaching-registry-bootstrap";

if (import.meta.env.DEV) {
  import("./store/ai-store").then(({ useAiStore }) => {
    (window as unknown as Record<string, unknown>).__ZUSTAND_STORES__ = {
      ai: useAiStore,
    };
  });
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ThemeProvider>
      <SettingsDialogProvider>
        <GarminBridgeProvider>
          <CoachingRegistryBootstrap>
            <App />
          </CoachingRegistryBootstrap>
        </GarminBridgeProvider>
      </SettingsDialogProvider>
    </ThemeProvider>
  </StrictMode>
);
