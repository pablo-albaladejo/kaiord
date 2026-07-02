/**
 * Extracts the Garmin-assigned workout id from the bridge push
 * response (the parsed `POST /workout-service/workout` echo).
 * Returns null on unexpected shapes — callers fall back to a
 * locally-generated id so the pushed state is still recorded.
 */
export const parseGarminWorkoutId = (data: unknown): string | null => {
  if (typeof data !== "object" || data === null) return null;
  const id = (data as { workoutId?: unknown }).workoutId;
  if (typeof id === "string" && id.length > 0) return id;
  if (typeof id === "number" && Number.isFinite(id)) return String(id);
  return null;
};
