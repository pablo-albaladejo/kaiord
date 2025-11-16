/**
 * WorkoutStats Component
 *
 * Displays workout statistics including total duration, distance, and step counts.
 *
 * Requirements:
 * - Requirement 9: Display workout statistics with real-time updates
 */

import React, { useMemo } from "react";
import type { Workout } from "../../../types/krd";
import { calculateWorkoutStats } from "../../../utils/workout-stats";
import { StatsContent } from "./StatsContent";

// ============================================
// Types
// ============================================

export type WorkoutStatsProps = {
  workout: Workout | null;
  className?: string;
};

// ============================================
// Component
// ============================================

export const WorkoutStats: React.FC<WorkoutStatsProps> = ({
  workout,
  className = "",
}) => {
  // Calculate stats (memoized for performance - Requirement 9.5)
  const stats = useMemo(() => calculateWorkoutStats(workout), [workout]);

  // Don't render if no workout
  if (!workout) {
    return null;
  }

  return (
    <div
      className={`rounded-lg border border-gray-200 bg-white p-4 shadow-sm ${className}`}
      role="region"
      aria-label="Workout statistics"
    >
      <h2 className="mb-3 text-lg font-semibold text-gray-900">
        Workout Stats
      </h2>
      <div className="space-y-2">
        <StatsContent stats={stats} />
      </div>
    </div>
  );
};
