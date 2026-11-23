/**
 * Surfaces the result of the Dexie v10 retro-match migration once per
 * app boot. Reads from the migration's module-level result slot
 * (populated inside Dexie's upgrade callback before this hook ever
 * mounts) and fires:
 *
 *   - an info toast saying workouts were matched to coaching activities
 *     when N > 0 (no toast on N === 0);
 *   - the analytics event `coaching.dexie_v10.migrated` with the
 *     count regardless.
 *
 * The result slot is consume-once, so React StrictMode's double-mount
 * cannot replay the toast.
 */
import { useEffect } from "react";

import { consumeLastV10Result } from "../adapters/dexie/dexie-v10-migration";
import { useAnalytics } from "../contexts";
import { useToastContext } from "../contexts/ToastContext";
import { useTranslate } from "../i18n/use-translate";

// The toast titles are static keys (R-PIIInterpolation): the concrete count
// is surfaced via the analytics event payload, not the toast title.

export const useV10MigrationToast = (): void => {
  const analytics = useAnalytics();
  const toasts = useToastContext();
  const t = useTranslate("coaching");

  useEffect(() => {
    const result = consumeLastV10Result();
    if (!result) return;
    analytics.event("coaching.dexie_v10.migrated", { count: result.created });
    if (result.created === 1) {
      toasts.info(t("hooks.migratedOne"));
    } else if (result.created > 1) {
      toasts.info(t("hooks.migratedMany"));
    }
  }, [analytics, toasts, t]);
};
