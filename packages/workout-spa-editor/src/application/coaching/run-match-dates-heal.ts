/**
 * Runs the match-date heal for one profile, or for all of them after an
 * import, and reports it through analytics as a bare count (no ids). A heal
 * failure is reported and swallowed: it must never fail the sync or the
 * import that triggered it, and the next trigger retries.
 */
import type { Analytics } from "@kaiord/core";

import type { PersistencePort } from "../../ports/persistence-port";
import { healAllMatchDates, healMatchDates } from "./heal-match-dates";

export type MatchDatesHealScope = { profileId: string } | "all-profiles";

export const runMatchDatesHeal = async (
  persistence: PersistencePort,
  analytics: Pick<Analytics, "event">,
  scope: MatchDatesHealScope
): Promise<void> => {
  const deps = { ...persistence, now: () => new Date().toISOString() };
  try {
    const healed =
      scope === "all-profiles"
        ? await healAllMatchDates(deps)
        : await healMatchDates(deps, scope);
    if (healed > 0) analytics.event("coaching.match_dates.healed", { healed });
  } catch {
    analytics.event("coaching.match_dates.heal_failed");
  }
};
