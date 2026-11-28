import type { RepushVerdict } from "../application/trainingpeaks/trainingpeaks-repush-guard";
import type { UnansweredVerdict } from "../application/trainingpeaks/unanswered-send";
import type { TrainingPeaksPushFailureOutcome } from "./trainingpeaks-push-failure";

export type TrainingPeaksPushOutcome =
  /**
   * `workoutId` is absent on a `lost-race` outcome, where another caller owns
   * the in-flight POST — the push still succeeded, this caller just does not
   * own the id. Callers must not assume an id is always there.
   */
  | { ok: true; workoutId: string | undefined }
  | TrainingPeaksPushFailureOutcome
  /** A changed workout TrainingPeaks already holds (`allowCopy`
      overrides), or one whose last send got no answer (`sendAnyway`). */
  | { ok: false; block: TrainingPeaksBlock };

export type TrainingPeaksBlock =
  | Extract<RepushVerdict, { blocked: true }>
  | Extract<UnansweredVerdict, { blocked: true }>;

export type TrainingPeaksPushOptions = {
  allowCopy?: boolean;
  sendAnyway?: boolean;
};
