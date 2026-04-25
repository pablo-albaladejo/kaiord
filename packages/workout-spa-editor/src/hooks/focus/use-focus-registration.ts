/**
 * `useFocusRegistration` — small wrapper around
 * `FocusRegistryContext.registerItem` / `unregisterItem` so every
 * card component can self-register with a one-liner.
 *
 * Returns a callback ref that the consumer installs on its root
 * element. The hook handles the StrictMode double-mount dance (the
 * registry's own unregister is identity-gated) and the missing-id
 * case (no-op).
 */

import type { RefCallback } from "react";
import { useCallback, useContext, useLayoutEffect, useRef } from "react";

import { FocusRegistryContext } from "../../contexts/focus-registry-context";
import type { ItemId } from "../../store/providers/item-id";

export const useFocusRegistration = <T extends HTMLElement>(
  id: string | undefined
): {
  ref: RefCallback<T>;
  current: T | null;
} => {
  const registry = useContext(FocusRegistryContext);
  const internalRef = useRef<T | null>(null);

  // useLayoutEffect (not useEffect) so newly mounted cards are registered
  // before the parent's useFocusAfterAction layout effect runs its lookup.
  // Without this, undo-restored and duplicated steps miss the registry.
  useLayoutEffect(() => {
    const el = internalRef.current;
    if (!el || !id) return;
    const itemId = id as ItemId;
    registry.registerItem(itemId, el);
    return () => registry.unregisterItem(itemId, el);
  }, [id, registry]);

  const ref = useCallback<RefCallback<T>>((node) => {
    internalRef.current = node;
  }, []);

  return { ref, current: internalRef.current };
};
