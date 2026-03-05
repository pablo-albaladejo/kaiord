import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import { ThemeProvider } from "./contexts";
import "./index.css";

if (import.meta.env.DEV) {
  import("./store/ai-store").then(({ useAiStore }) => {
    import("./store/garmin-store").then(({ useGarminStore }) => {
      (window as unknown as Record<string, unknown>).__ZUSTAND_STORES__ = {
        ai: useAiStore,
        garmin: useGarminStore,
      };
    });
  });
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ThemeProvider>
      <App />
    </ThemeProvider>
  </StrictMode>
);
