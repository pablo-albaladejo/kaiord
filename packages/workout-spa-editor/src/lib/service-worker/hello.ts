// The page tells the worker which build it runs, by the URL of its own
// entry module, so the worker keeps that build's cache while it lives.

const CLIENT_COUNT_TIMEOUT_MS = 1_000;

const entryUrl = (): string | undefined =>
  document.querySelector<HTMLScriptElement>('script[type="module"][src]')?.src;

export async function sayHello(container: ServiceWorkerContainer) {
  const entry = entryUrl();
  if (!entry) return;
  const target = container.controller ?? (await container.ready).active;
  target?.postMessage({ type: "HELLO", entry });
}

/** Windows of the App open in this browser; Infinity when unknown. */
export function countWindows(
  container: ServiceWorkerContainer
): Promise<number> {
  const controller = container.controller;
  if (!controller) return Promise.resolve(Infinity);
  return new Promise((resolve) => {
    const done = (count: number) => {
      clearTimeout(timer);
      container.removeEventListener("message", onMessage);
      resolve(count);
    };
    const onMessage = (event: MessageEvent) => {
      if (event.data?.type === "CLIENT_COUNT") done(Number(event.data.count));
    };
    const timer = setTimeout(() => done(Infinity), CLIENT_COUNT_TIMEOUT_MS);
    container.addEventListener("message", onMessage);
    container.startMessages();
    controller.postMessage({ type: "CLIENT_COUNT" });
  });
}
