/**
 * useElementHighlight Hook
 *
 * Element highlighting logic for tutorial.
 */

import { useEffect, useState } from "react";

export function useElementHighlight(open: boolean, targetSelector?: string) {
  const [highlightedElement, setHighlightedElement] =
    useState<HTMLElement | null>(null);

  useEffect(() => {
    if (!open || !targetSelector) {
      setHighlightedElement(null);
      return;
    }

    const element = document.querySelector<HTMLElement>(targetSelector);
    if (element) {
      setHighlightedElement(element);
      if (typeof element.scrollIntoView === "function") {
        element.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }

    return () => {
      setHighlightedElement(null);
    };
  }, [open, targetSelector]);

  return highlightedElement;
}
