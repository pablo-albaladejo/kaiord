/**
 * FocusRegistryContext — maps stable `ItemId`s to their mounted DOM
 * elements so that `useFocusAfterAction` (§7.2) can resolve a
 * `FocusTarget` without walking the React tree.
 *
 * Contract:
 *   - registerItem(id, el) — idempotent; last-writer wins if the id is
 *     already registered to a different element (covers the StrictMode
 *     double-mount case where the second mount registers before the
 *     first mount's cleanup runs).
 *   - unregisterItem(id, el) — only deletes when the stored element is
 *     reference-equal to `el`. This is the StrictMode guard: a stale
 *     cleanup from the first mount must not evict the live element
 *     registered by the second mount.
 *   - Context `value` is reference-stable across re-renders — the
 *     registry Map lives in a ref; the exposed callbacks are `useCallback`
 *     with no deps. A memoized consumer does not re-render when the
 *     parent re-renders without touching the registry.
 *
 * Purity: no store reads, no DOM globals beyond `HTMLElement`.
 */

import type { ReactNode } from "react";
import { createContext, useCallback, useMemo, useRef } from "react";

import type { ItemId } from "../store/providers/item-id";

export type FocusRegistryValue = {
  registerItem: (id: ItemId, el: HTMLElement) => void;
  unregisterItem: (id: ItemId, el: HTMLElement) => void;
  getItem: (id: ItemId) => HTMLElement | undefined;
};

const noopRegistry: FocusRegistryValue = {
  registerItem: () => {},
  unregisterItem: () => {},
  getItem: () => undefined,
};

export const FocusRegistryContext =
  createContext<FocusRegistryValue>(noopRegistry);

export function FocusRegistryProvider({ children }: { children: ReactNode }) {
  const registryRef = useRef<Map<ItemId, HTMLElement> | null>(null);
  if (registryRef.current === null) {
    registryRef.current = new Map();
  }

  const registerItem = useCallback((id: ItemId, el: HTMLElement) => {
    registryRef.current!.set(id, el);
  }, []);

  const unregisterItem = useCallback((id: ItemId, el: HTMLElement) => {
    const stored = registryRef.current!.get(id);
    if (stored === el) {
      registryRef.current!.delete(id);
    }
  }, []);

  const getItem = useCallback((id: ItemId) => registryRef.current!.get(id), []);

  const value = useMemo<FocusRegistryValue>(
    () => ({ registerItem, unregisterItem, getItem }),
    [registerItem, unregisterItem, getItem]
  );

  return (
    <FocusRegistryContext.Provider value={value}>
      {children}
    </FocusRegistryContext.Provider>
  );
}
