import { TRAININGPEAKS_BRIDGE_ID } from "../trainingpeaks/trainingpeaks-weight-import";

/** The day a TrainingPeaks copy is pushed to; no other destination has one. */
export const destinationDateOf = (
  destinationBridgeId: string,
  payload: Record<string, unknown>
): string | undefined =>
  destinationBridgeId === TRAININGPEAKS_BRIDGE_ID &&
  typeof payload.workoutDay === "string"
    ? payload.workoutDay
    : undefined;
