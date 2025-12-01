/**
 * Step Colors
 *
 * Determines colors for workout steps based on intensity and target.
 */

export function getStepColor(step: unknown): string {
  if (typeof step !== "object" || step === null) {
    return "#3b82f6"; // Default blue
  }

  // Purple for repetition blocks
  if ("repeatCount" in step) {
    return "#8b5cf6";
  }

  // Color based on intensity
  const intensity = (step as { intensity?: string }).intensity;
  if (intensity === "warmup") return "#10b981"; // Green
  if (intensity === "cooldown") return "#06b6d4"; // Cyan
  if (intensity === "rest") return "#6b7280"; // Gray

  // Color based on target type for active intervals
  if (intensity === "active") {
    const targetType = (step as { targetType?: string }).targetType;
    if (targetType === "power") return "#ef4444"; // Red
    if (targetType === "heart_rate") return "#f59e0b"; // Orange
  }

  return "#3b82f6"; // Default blue
}
