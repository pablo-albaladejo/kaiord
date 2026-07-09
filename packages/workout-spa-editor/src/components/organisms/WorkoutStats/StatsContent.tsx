/**
 * StatsContent Component
 *
 * Renders the statistics content rows.
 */

import React from "react";

import { type Translate, useTranslate } from "../../../i18n/use-translate";
import type { WorkoutStats } from "../../../utils/workout-stats";
import { formatDistance, formatDuration } from "./format-helpers";
import { StatRow } from "./StatRow";
import { StatValue } from "./StatValue";

export type StatsContentProps = {
  stats: WorkoutStats;
};

const DurationRow: React.FC<{ stats: WorkoutStats; t: Translate }> = ({
  stats,
  t,
}) => (
  <StatRow
    label={t("stats.totalDuration")}
    value={
      <StatValue
        value={
          stats.totalDuration !== null
            ? formatDuration(stats.totalDuration)
            : null
        }
        hasEstimate={stats.hasOpenSteps}
      />
    }
  />
);

const DistanceRow: React.FC<{ stats: WorkoutStats; t: Translate }> = ({
  stats,
  t,
}) => (
  <StatRow
    label={t("stats.totalDistance")}
    value={
      <StatValue
        value={
          stats.totalDistance !== null
            ? formatDistance(stats.totalDistance)
            : null
        }
        hasEstimate={stats.hasOpenSteps}
      />
    }
  />
);

export const StatsContent: React.FC<StatsContentProps> = ({ stats }) => {
  const t = useTranslate("workout-detail");
  return (
    <>
      <DurationRow stats={stats} t={t} />
      <DistanceRow stats={stats} t={t} />
      <StatRow
        label={t("stats.totalSteps")}
        value={t(
          stats.stepCount === 1 ? "stats.steps_one" : "stats.steps_other",
          {
            n: stats.stepCount,
          }
        )}
      />
      {stats.repetitionCount > 0 && (
        <StatRow
          label={t("stats.repetitionBlocks")}
          value={t(
            stats.repetitionCount === 1
              ? "stats.repetitions_one"
              : "stats.repetitions_other",
            { n: stats.repetitionCount }
          )}
        />
      )}
      {stats.hasOpenSteps && (
        <div className="mt-3 border-t border-gray-200 pt-2">
          <p className="text-xs text-gray-500">{t("stats.estimateNote")}</p>
        </div>
      )}
    </>
  );
};
