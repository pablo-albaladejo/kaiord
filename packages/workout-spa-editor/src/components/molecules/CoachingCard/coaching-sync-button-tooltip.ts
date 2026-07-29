/**
 * Tooltip composer + reduced-motion hook for `CoachingSyncButton`.
 *
 * Split out so the component file stays under the 80-line lint cap.
 * `buildSyncTooltip` is a plain function (not a hook), so it takes the
 * caller's `Translate` and active `Locale` as arguments instead of
 * resolving them itself — the "syncing…" wording and the
 * `formatRelativeTime` key both render through that translator, so the
 * tooltip localizes with the rest of the UI.
 */

import type { Locale } from "@kaiord/i18n";
import { useEffect, useState } from "react";

import type { Translate } from "../../../i18n/use-translate";
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
  t: Translate,
  locale: Locale,
  now: Date = new Date()
): string => {
  if (loading) return `${label} · ${t("sync.syncing")}`;
  const date = lastSyncedAt ? new Date(lastSyncedAt) : undefined;
  const relative = formatRelativeTime(date, now, locale);
  return `${label} · ${t(relative.key, relative.params)}`;
};
