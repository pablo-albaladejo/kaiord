import { watchDialogInput } from "../unsaved-dialog-input";
import { trackFirstInput } from "./first-input";
import { sayHello } from "./hello";
import { isReloadRequested } from "./update-store";
import { watchRegistration } from "./watch-registration";

export type StartOptions = {
  prod: boolean;
  base: string;
  container: ServiceWorkerContainer | undefined;
  saveData: boolean;
  reload: () => void;
  /** Runs once the page has loaded and the browser is idle. */
  whenReady: (run: () => void) => void;
  sinceLoadMs: () => number;
};

/**
 * Registers the App's service worker in a production build (design D2, D4,
 * D7): never in development, never under Save-Data, and only once the page
 * has loaded and the browser is idle, so it never competes with first paint.
 */
export function startServiceWorker(options: StartOptions): void {
  const { container, base } = options;
  if (!options.prod || !container || options.saveData) return;
  trackFirstInput();
  watchDialogInput();
  let reloading = false;
  void sayHello(container).catch(() => undefined);
  container.addEventListener("controllerchange", () => {
    void sayHello(container).catch(() => undefined);
    if (!isReloadRequested() || reloading) return;
    reloading = true;
    options.reload();
  });
  options.whenReady(() => {
    container
      .register(`${base}sw.js`, { scope: base })
      .then((registration) =>
        watchRegistration(registration, {
          container,
          sinceLoadMs: options.sinceLoadMs,
        })
      )
      .catch(() => undefined);
  });
}
