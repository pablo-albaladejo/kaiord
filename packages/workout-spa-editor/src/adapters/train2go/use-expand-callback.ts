/** `useExpandCallback` — split out so `use-train2go-actions.ts` stays under cap. */
import type { Analytics } from "@kaiord/core";
import { useCallback } from "react";

import type { CoachingTransport } from "../../application/coaching/coaching-transport-port";
import { expandDay } from "../../application/coaching/expand-day";
import type { PersistencePort } from "../../ports/persistence-port";

export const useExpandCallback = (
  p: PersistencePort,
  t: CoachingTransport,
  a: Analytics
) =>
  useCallback(
    async (profileId: string, date: string) => {
      a.event("coaching.expand_day.invoked", {
        source: t.source,
        profileId,
      });
      await expandDay(
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
