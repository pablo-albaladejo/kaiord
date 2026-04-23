/**
 * Overlay observer public API (§7.4).
 *
 * See `overlay-singleton.ts` (ref-counted lifecycle + test mirror) and
 * `overlay-mutation-observer.ts` (MutationObserver wiring +
 * missing-MO fallback) for the moving parts this module composes.
 *
 * Missing-`MutationObserver` fallback: one dev-mode warning per
 * process, initial count of zero delivered synchronously, no-op
 * unsubscribe. No exceptions cross the API boundary.
 */

import { countOverlays } from "./overlay-count";
import {
  createObserverFor,
  getMutationObserverCtor,
  resetMutationObserverMissingWarned,
  subscribeDegraded,
} from "./overlay-mutation-observer";
import {
  clearSingleton,
  getSingleton,
  type OverlayCallback,
  peekSingleton,
  type RootEntry,
} from "./overlay-singleton";

const ensureRootEntry = (rootEl: HTMLElement): RootEntry => {
  const singleton = getSingleton();
  const existing = singleton.roots.get(rootEl);
  if (existing) return existing;
  const entry: RootEntry = {
    observer: null,
    subscribers: new Set(),
    lastCount: countOverlays(rootEl),
  };
  entry.observer = createObserverFor(rootEl, entry);
  singleton.roots.set(rootEl, entry);
  return entry;
};

const unsubscribeFrom = (
  rootEl: HTMLElement,
  callback: OverlayCallback
): void => {
  const singleton = peekSingleton();
  if (!singleton) return;
  const entry = singleton.roots.get(rootEl);
  if (!entry) return;
  entry.subscribers.delete(callback);
  if (entry.subscribers.size > 0) return;
  entry.observer?.disconnect();
  singleton.roots.delete(rootEl);
  if (singleton.roots.size === 0) clearSingleton();
};

export const subscribeToOverlayCount = (
  rootEl: HTMLElement,
  callback: OverlayCallback
): (() => void) => {
  if (!getMutationObserverCtor()) return subscribeDegraded(callback);
  const entry = ensureRootEntry(rootEl);
  entry.subscribers.add(callback);
  callback(entry.lastCount);
  return () => unsubscribeFrom(rootEl, callback);
};

/**
 * Test-only teardown. Disconnects every MutationObserver, clears both
 * module- and global-mirror singletons, and resets the one-shot
 * MutationObserver-missing warning latch. Safe when no subscriptions
 * exist.
 */
export const __resetOverlayObserverForTests = (): void => {
  const singleton = peekSingleton();
  if (singleton) {
    singleton.roots.forEach((entry) => {
      entry.observer?.disconnect();
      entry.subscribers.clear();
    });
    singleton.roots.clear();
  }
  clearSingleton();
  resetMutationObserverMissingWarned();
};
