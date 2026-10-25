/**
 * Startup trigger for the match-date heal (design §3.5): once per app session
 * per profile, as soon as the active profile is known. Cloud and backup
 * imports run the heal themselves through `SyncProvider`'s `afterImport`.
 */
import { useEffect, useRef } from "react";

import { runMatchDatesHeal } from "../application/coaching/run-match-dates-heal";
import { useAnalytics } from "../contexts/analytics-context";
import { usePersistence } from "../contexts/persistence-context";

export const useMatchDatesHeal = (profileId: string | null): void => {
  const persistence = usePersistence();
  const analytics = useAnalytics();
  const healed = useRef(new Set<string>());

  useEffect(() => {
    if (!profileId || healed.current.has(profileId)) return;
    healed.current.add(profileId);
    void runMatchDatesHeal(persistence, analytics, { profileId });
  }, [profileId, persistence, analytics]);
};
