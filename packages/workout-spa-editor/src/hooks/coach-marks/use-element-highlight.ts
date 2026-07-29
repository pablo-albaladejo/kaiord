/**
 * `useElementHighlight` — resolves the element a coach mark points at.
 *
 * The tutorial version queried the document with a CSS selector, which meant
 * every step that wanted a real target had to hardcode a class name. Cards
 * already self-register with `FocusRegistryContext` (`useFocusRegistration`),
 * so the id the store already knows resolves straight to the mounted node.
 *
 * Returns `null` whenever the id is unknown — an unmounted or scrolled-away
 * item yields no mark rather than a mark pointing at nothing.
 */

import { useContext, useEffect, useState } from "react";

import { FocusRegistryContext } from "../../contexts/focus-registry-context";
import { asItemId } from "../../store/providers/item-id";

export function useElementHighlight(
  open: boolean,
  itemId?: string | null
): HTMLElement | null {
  const registry = useContext(FocusRegistryContext);
  const [highlightedElement, setHighlightedElement] =
    useState<HTMLElement | null>(null);

  useEffect(() => {
    if (!open || !itemId) {
      setHighlightedElement(null);
      return;
    }

    const element = registry.getItem(asItemId(itemId)) ?? null;
    setHighlightedElement(element);
    if (element && typeof element.scrollIntoView === "function") {
      element.scrollIntoView({ behavior: "smooth", block: "center" });
    }

    return () => {
      setHighlightedElement(null);
    };
  }, [open, itemId, registry]);

  return highlightedElement;
}
