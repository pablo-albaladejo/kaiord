/**
 * MutationObserver wiring isolated from the public `subscribeToOverlayCount`
 * entry point, so the public module stays under the 80-line limit.
 */

import { countOverlays } from "./overlay-count";
import type { OverlayCallback, RootEntry } from "./overlay-singleton";

export const getMutationObserverCtor = () =>
  (globalThis as { MutationObserver?: typeof MutationObserver })
    .MutationObserver;

export const notifyIfChanged = (entry: RootEntry, nextCount: number): void => {
  if (nextCount === entry.lastCount) return;
  entry.lastCount = nextCount;
  entry.subscribers.forEach((cb) => cb(nextCount));
};

export const createObserverFor = (
  root: HTMLElement,
  entry: RootEntry
): MutationObserver | null => {
  const MO = getMutationObserverCtor();
  if (!MO) return null;
  const obs = new MO(() => {
    notifyIfChanged(entry, countOverlays(root));
  });
  obs.observe(root, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ["data-state", "role"],
  });
  return obs;
};

let mutationObserverMissingWarned = false;

export const resetMutationObserverMissingWarned = (): void => {
  mutationObserverMissingWarned = false;
};

const isProduction = () => import.meta.env.MODE === "production";

export const warnMutationObserverMissing = (): void => {
  if (mutationObserverMissingWarned) return;
  mutationObserverMissingWarned = true;
  if (isProduction()) return;
  console.warn(
    "[focus] MutationObserver unavailable; overlay guard disabled, " +
      "focus moves will fire without waiting for open dialogs/menus"
  );
};

export const subscribeDegraded = (callback: OverlayCallback): (() => void) => {
  warnMutationObserverMissing();
  callback(0);
  return () => {};
};
