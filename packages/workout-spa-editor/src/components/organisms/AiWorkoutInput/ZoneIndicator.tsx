/**
 * ZoneIndicator Component
 *
 * Shows profile name and thresholds for the selected sport in AI form.
 */

import { useActiveProfileLive } from "../../../hooks/use-active-profile-live";
import type { SportKey } from "../../../types/sport-zones";
import { formatThresholdSummary } from "./zone-indicator-helpers";

type ZoneIndicatorProps = {
  sport: string;
};

export function ZoneIndicator({ sport }: ZoneIndicatorProps) {
  // Live read of the active profile via the Dexie singleton (D1).
  // `undefined` while loading collapses to `null` so the "No profile
  // selected" branch renders during the initial paint, matching the
  // pre-migration empty-store behavior.
  const profile = useActiveProfileLive()?.profile ?? null;

  if (!profile) {
    return (
      <p className="text-xs text-gray-400 dark:text-gray-500">
        No profile selected. Set up a profile to include training zones.
      </p>
    );
  }

  const sportKey = (sport || undefined) as SportKey | undefined;
  const config = sportKey ? profile.sportZones?.[sportKey] : undefined;

  if (sportKey && !config) {
    return (
      <p className="text-xs text-amber-600 dark:text-amber-400">
        No {sportKey} zones configured for {profile.name}.
      </p>
    );
  }

  const summary = config
    ? formatThresholdSummary(config.thresholds)
    : `Profile: ${profile.name}`;

  return (
    <p className="text-xs text-gray-600 dark:text-gray-400">
      {profile.name} {summary ? `- ${summary}` : ""}
    </p>
  );
}
