import type { StartOptions } from "./start-service-worker";

type SaveDataNavigator = Navigator & { connection?: { saveData?: boolean } };

// Safari has no requestIdleCallback; two seconds after load stands in.
const IDLE_FALLBACK_MS = 2_000;

const whenLoadedAndIdle = (run: () => void): void => {
  const idle = () => {
    if ("requestIdleCallback" in window) window.requestIdleCallback(run);
    else setTimeout(run, IDLE_FALLBACK_MS);
  };
  if (document.readyState === "complete") idle();
  else window.addEventListener("load", idle, { once: true });
};

/** The real browser behind `startServiceWorker`. */
export const browserStartOptions = (env: ImportMetaEnv): StartOptions => ({
  prod: env.PROD,
  base: env.BASE_URL,
  container: "serviceWorker" in navigator ? navigator.serviceWorker : undefined,
  saveData: (navigator as SaveDataNavigator).connection?.saveData === true,
  reload: () => window.location.reload(),
  whenReady: whenLoadedAndIdle,
  sinceLoadMs: () => performance.now(),
});
