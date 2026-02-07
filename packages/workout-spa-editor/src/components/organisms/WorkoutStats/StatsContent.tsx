/**
 * StatsContent Component
 *
 * Renders the statistics content rows.
 */

import React from "react";
import { formatDistance, formatDuration } from "./format-helpers";
import { StatRow } from "./StatRow";
import { StatValue } from "./StatValue";
import type { WorkoutStats } from "../../../utils/workout-stats";

export type StatsContentProps = {
  stats: WorkoutStats;
};

const DurationRow: React.FC<{ stats: WorkoutStats }> = ({ stats }) => (
  <StatRow
    label="Total Duration:"
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

const DistanceRow: React.FC<{ stats: WorkoutStats }> = ({ stats }) => (
  <StatRow
    label="Total Distance:"
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

export const StatsContent: React.FC<StatsContentProps> = ({ stats }) => (
  <>
    <DurationRow stats={stats} />
    <DistanceRow stats={stats} />
    <StatRow
      label="Total Steps:"
      value={`${stats.stepCount} ${stats.stepCount === 1 ? "step" : "steps"}`}
    />
    {stats.repetitionCount > 0 && (
      <StatRow
        label="Repetition Blocks:"
        value={`${stats.repetitionCount} ${stats.repetitionCount === 1 ? "repetition" : "repetitions"}`}
      />
    )}
    {stats.hasOpenSteps && (
      <div className="mt-3 border-t border-gray-200 pt-2">
        <p className="text-xs text-gray-500">
          * Totals are estimates due to open-ended or conditional steps
        </p>
      </div>
    )}
  </>
);
