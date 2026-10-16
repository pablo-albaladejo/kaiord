/** `useExpandCallback` — split out so `use-train2go-actions.ts` stays under cap. */
import type { Analytics } from "@kaiord/core";
import { useCallback } from "react";

import type { CoachingTransport } from "../../application/coaching/coaching-transport-port";
import { lazyImport } from "../../lib/lazy-import";
import type { PersistencePort } from "../../ports/persistence-port";
import type { ExpandDayResult } from "../../types/coaching-expand-result";

export const useExpandCallback = (
  p: PersistencePort,
  t: CoachingTransport,
  a: Analytics
) =>
  useCallback(
    async (profileId: string, date: string): Promise<ExpandDayResult> => {
      a.event("coaching.expand_day.invoked", { source: t.source });
      // A failed load answers the dialog's retryable failure, not a spinner
      // that never settles.
      const loaded = await lazyImport(
        () => import("../../application/coaching/expand-day")
      ).catch(() => null);
      if (!loaded) return { ok: false, reason: "transport-error" };
      return loaded.expandDay(
        {
          profiles: p.profiles,
          coaching: p.coaching,
          coachingDayNotes: p.coachingDayNotes,
          transport: t,
        },
        profileId,
        date
      );
    },
    [p, t, a]
  );
