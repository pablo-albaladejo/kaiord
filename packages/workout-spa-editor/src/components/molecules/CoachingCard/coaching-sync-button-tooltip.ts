/**
 * Tooltip composer + reduced-motion hook for `CoachingSyncButton`.
 *
 * Split out so the component file stays under the 80-line lint cap. All
 * tooltip outputs are static literals composed from a fixed `<Label>`
 * prefix and the deterministic branches of `formatRelativeTime`, so the
 * project's R-PIIInterpolation guard remains green.
 */

import { useEffect, useState } from "react";

import { formatRelativeTime } from "../../../utils/format-relative-time";

const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";

export const usePrefersReducedMotion = (): boolean => {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    const mql = window.matchMedia(REDUCED_MOTION_QUERY);
    const update = () => setReduced(mql.matches);
    update();
    mql.addEventListener("change", update);
    return () => mql.removeEventListener("change", update);
  }, []);
  return reduced;
};

export const buildSyncTooltip = (
  label: string,
  loading: boolean,
  lastSyncedAt: string | undefined,
  now: Date = new Date()
): string => {
  if (loading) return `${label} · syncing…`;
  const date = lastSyncedAt ? new Date(lastSyncedAt) : undefined;
  return `${label} · ${formatRelativeTime(date, now)}`;
};
