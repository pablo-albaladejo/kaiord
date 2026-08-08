/**
 * Helper functions for WorkoutCard component
 */

export const formatDuration = (seconds?: number): string => {
  if (!seconds) return "Unknown";
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
};

/* Difficulty is a category, not a temperature. Green/amber/red read as a
   severity ramp the palette does not have — and the chip already spells the
   word out, so the hue was decoration competing with the zone ramp. */
const CHIP = "bg-surface-elevated text-ink-body";

export const getDifficultyColor = (): string => CHIP;
