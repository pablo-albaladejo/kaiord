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
import { formatDuration } from "./format-helpers";

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
  // Calculate stats (memoized for performance)
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
        {/* Total Duration */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">Total Duration:</span>
          <span className="text-sm font-medium text-gray-900">
            {stats.totalDuration !== null ? (
              <>
                {formatDuration(stats.totalDuration)}
                {stats.hasOpenSteps && (
                  <span
                    className="ml-1 text-xs text-gray-500"
                    title="Estimate due to open-ended steps"
                  >
                    *
                  </span>
                )}
              </>
            ) : (
              <span className="text-gray-500">—</span>
            )}
          </span>
        </div>

        {/* Total Distance */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">Total Distance:</span>
          <span className="text-sm font-medium text-gray-900">
            {stats.totalDistance !== null ? (
              <>
                {formatDistance(stats.totalDistance)}
                {stats.hasOpenSteps && (
                  <span
                    className="ml-1 text-xs text-gray-500"
                    title="Estimate due to open-ended steps"
                  >
                    *
                  </span>
                )}
              </>
            ) : (
              <span className="text-gray-500">—</span>
            )}
          </span>
        </div>

        {/* Step Count */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">Total Steps:</span>
          <span className="text-sm font-medium text-gray-900">
            {stats.stepCount}
          </span>
        </div>

        {/* Repetition Count */}
        {stats.repetitionCount > 0 && (
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Repetition Blocks:</span>
            <span className="text-sm font-medium text-gray-900">
              {stats.repetitionCount}
            </span>
          </div>
        )}

        {/* Estimate Notice */}
        {stats.hasOpenSteps && (
          <div className="mt-3 border-t border-gray-200 pt-2">
            <p className="text-xs text-gray-500">
              * Totals are estimates due to open-ended or conditional steps
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

// ============================================
// Helper Functions
// ============================================

/**
 * Format distance in meters to human-readable format
 */
const formatDistance = (meters: number): string => {
  if (meters >= 1000) {
    const km = meters / 1000;
    return `${km.toFixed(2)} km`;
  }
  return `${meters.toFixed(0)} m`;
};
