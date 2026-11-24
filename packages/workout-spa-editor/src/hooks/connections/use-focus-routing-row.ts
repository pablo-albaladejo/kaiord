/**
 * `/connections?kind=weight` (the link of the Authority notice) brings that
 * kind's row into view and gives it focus once, as soon as the row is there,
 * so the athlete lands where the change can be made; later renders leave
 * focus alone. No smooth scroll: it would move the page under a press.
 */
import { useEffect, useRef } from "react";
import { useSearch } from "wouter";

export const useFocusRoutingRow = (rendered: unknown): void => {
  const kind = new URLSearchParams(useSearch()).get("kind");
  const focused = useRef<string | null>(null);
  useEffect(() => {
    if (kind === null || focused.current === kind) return;
    const row = document.getElementById(`routing-row-${kind}`);
    if (row === null) return;
    focused.current = kind;
    row.scrollIntoView?.({ block: "center" });
    row.focus({ preventScroll: true });
  }, [rendered, kind]);
};
