/**
 * ZoneIndicator Component
 *
 * Shows profile name and thresholds for the selected sport in AI form.
 */

import { useActiveProfileLive } from "../../../hooks/use-active-profile-live";
import { useTranslate } from "../../../i18n/use-translate";
import type { SportKey } from "../../../types/sport-zones";
import { formatThresholdSummary } from "./zone-indicator-helpers";

type ZoneIndicatorProps = {
  sport: string;
};

export function ZoneIndicator({ sport }: ZoneIndicatorProps) {
  const t = useTranslate("create-workout");
  // Live read of the active profile via the Dexie singleton (D1).
  // `undefined` while loading collapses to `null` so the "No profile
  // selected" branch renders during the initial paint, matching the
  // pre-migration empty-store behavior.
  const profile = useActiveProfileLive()?.profile ?? null;

  if (!profile) {
    return (
      <p className="text-xs text-gray-400 dark:text-gray-500">
        {t("zoneIndicator.noProfile")}
      </p>
    );
  }

  const sportKey = (sport || undefined) as SportKey | undefined;
  const config = sportKey ? profile.sportZones?.[sportKey] : undefined;

  if (sportKey && !config) {
    return (
      <p className="text-xs text-amber-600 dark:text-amber-400">
        {t("zoneIndicator.noZones", { sport: sportKey, name: profile.name })}
      </p>
    );
  }

  const summary = config
    ? formatThresholdSummary(config.thresholds)
    : t("zoneIndicator.profile", { name: profile.name });

  return (
    <p className="text-xs text-gray-600 dark:text-gray-400">
      {profile.name} {summary ? `- ${summary}` : ""}
    </p>
  );
}
