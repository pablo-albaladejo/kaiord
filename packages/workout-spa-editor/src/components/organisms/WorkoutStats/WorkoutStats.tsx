/**
 * WorkoutStats Component
 *
 * Displays workout statistics including total duration, distance, and step counts.
 *
 * Requirements:
 * - Requirement 9: Display workout statistics with real-time updates
 */

import React, { useMemo } from "react";

import { useTranslate } from "../../../i18n/use-translate";
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
  const t = useTranslate("workout-detail");

  // Don't render if no workout
  if (!workout) {
    return null;
  }

  // Bare: `EditorCanvas` owns the one border on the screen. This used to be
  // one of five sibling cards, which gave a summary the same weight as the
  // thing being edited.
  return (
    <div
      className={`space-y-2 ${className}`}
      role="region"
      aria-label={t("stats.region")}
    >
      <StatsContent stats={stats} />
    </div>
  );
};
