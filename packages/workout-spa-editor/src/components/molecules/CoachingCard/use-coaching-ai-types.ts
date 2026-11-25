import type { AiFailureReason } from "../../../application/coaching/convert-coaching-activity-error-mapper";
import type { AiRunProgress } from "./ai-run-progress";

export type AiFailureState = {
  reason: AiFailureReason | "not-found" | "no-provider";
  error?: string;
};

export type UseCoachingAi = {
  processing: boolean;
  progress: AiRunProgress | null;
  failure: AiFailureState | null;
  clearFailure: () => void;
  startAi: () => Promise<void>;
  /** Rebuild the existing Workout in place: explicit and billed. */
  regenerateAi: () => Promise<void>;
  cancelAi: () => void;
};
