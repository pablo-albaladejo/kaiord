/**
 * Overlay-observer singleton lifecycle — module-scoped in production,
 * mirrored on `globalThis.__kaiord_overlayObserver__` in test builds
 * so Vitest's per-file module resets do not fragment subscriptions.
 * Production bundles never touch the global handle (§7.4.e).
 */

export type OverlayCallback = (count: number) => void;

export type RootEntry = {
  observer: MutationObserver | null;
  subscribers: Set<OverlayCallback>;
  lastCount: number;
};

export type OverlaySingleton = {
  roots: Map<HTMLElement, RootEntry>;
};

const TEST_GLOBAL_KEY = "__kaiord_overlayObserver__";

export const isTestEnv = (): boolean => import.meta.env.MODE === "test";

let moduleSingleton: OverlaySingleton | null = null;

const readGlobalSingleton = (): OverlaySingleton | null => {
  if (!isTestEnv()) return null;
  const g = globalThis as Record<string, unknown>;
  return (g[TEST_GLOBAL_KEY] as OverlaySingleton | undefined) ?? null;
};

const writeGlobalSingleton = (s: OverlaySingleton | null) => {
  if (!isTestEnv()) return;
  const g = globalThis as Record<string, unknown>;
  if (s === null) delete g[TEST_GLOBAL_KEY];
  else g[TEST_GLOBAL_KEY] = s;
};

export const getSingleton = (): OverlaySingleton => {
  const fromGlobal = readGlobalSingleton();
  if (fromGlobal) {
    moduleSingleton = fromGlobal;
    return fromGlobal;
  }
  if (!moduleSingleton) {
    moduleSingleton = { roots: new Map() };
    writeGlobalSingleton(moduleSingleton);
  }
  return moduleSingleton;
};

export const clearSingleton = (): void => {
  moduleSingleton = null;
  writeGlobalSingleton(null);
};

export const peekSingleton = (): OverlaySingleton | null =>
  readGlobalSingleton() ?? moduleSingleton;
