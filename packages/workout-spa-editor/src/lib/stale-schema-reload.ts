import {
  hasAttempted,
  markAttempted,
  type MarkStorage,
  sessionMarkStorage,
} from "./stale-reload-mark";

// A deploy can take minutes to reach the edge; boot waits only this long.
export const WORKER_WAIT_MS = 15_000;

export type StaleReloadOutcome = "reloading" | "no-registration" | "try-again";

export type StaleReloadEnv = {
  serviceWorker?: Pick<ServiceWorkerContainer, "getRegistration">;
  storage?: MarkStorage;
  reload: () => void;
  waitMs?: number;
};

const browserEnv = (): StaleReloadEnv => ({
  serviceWorker:
    typeof navigator === "undefined" ? undefined : navigator.serviceWorker,
  storage: sessionMarkStorage(),
  reload: () => window.location.reload(),
});

const waitForState = (
  worker: ServiceWorker,
  targets: ServiceWorkerState[],
  ms: number
): Promise<ServiceWorkerState | "timeout"> =>
  new Promise((resolve) => {
    if (targets.includes(worker.state)) return resolve(worker.state);
    const onChange = () => {
      if (!targets.includes(worker.state)) return;
      clearTimeout(timer);
      worker.removeEventListener("statechange", onChange);
      resolve(worker.state);
    };
    const timer = setTimeout(() => {
      worker.removeEventListener("statechange", onChange);
      resolve("timeout");
    }, ms);
    worker.addEventListener("statechange", onChange);
  });

const findRegistration = async (env: StaleReloadEnv) => {
  try {
    return await env.serviceWorker?.getRegistration();
  } catch {
    return undefined;
  }
};

/**
 * D9 step 4: bring in the newer worker, then reload into it. `auto` is the
 * boot's own attempt: it never reloads without a worker, and runs once per
 * session. A click always tries, and without a registration just reloads.
 */
export async function reloadIntoNewerCode(
  { auto }: { auto: boolean },
  env: StaleReloadEnv = browserEnv()
): Promise<StaleReloadOutcome> {
  const registration = await findRegistration(env);
  if (!registration) {
    if (auto) return "no-registration";
    env.reload();
    return "reloading";
  }
  if (auto && hasAttempted(env.storage)) return "try-again";
  const updated = await Promise.resolve()
    .then(() => registration.update())
    .then(
      () => true,
      () => false
    );
  const worker = registration.waiting ?? registration.installing;
  if (!updated || !worker) return "try-again";
  const ms = env.waitMs ?? WORKER_WAIT_MS;
  if (
    (await waitForState(worker, ["installed", "redundant"], ms)) !== "installed"
  )
    return "try-again";
  markAttempted(env.storage);
  worker.postMessage({ type: "SKIP_WAITING" });
  await waitForState(worker, ["activated", "redundant"], ms);
  env.reload();
  return "reloading";
}
