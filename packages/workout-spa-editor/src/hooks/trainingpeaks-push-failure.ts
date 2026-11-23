import { TRAININGPEAKS_HORIZON_STATUS } from "../application/trainingpeaks/trainingpeaks-planning-horizon";

/**
 * Why a send stopped, worded by the App (`TrainingPeaksPushFeedback`):
 * TrainingPeaks refused the day (a 402), did not answer (no cause known), the
 * workout has no steps, the extension is missing, or the Session is gone.
 */
export type TrainingPeaksPushRefusal =
  "horizon" | "not-answering" | "no-steps" | "install" | "sign-in";

export type TrainingPeaksPushFailureOutcome =
  /** An upstream error's own message, shown as is. */
  | { ok: false; message: string }
  | { ok: false; reason: TrainingPeaksPushRefusal };

const statusOf = (error: unknown): unknown =>
  (error as { status?: unknown } | null)?.status;

/** A 402 is TrainingPeaks refusing the day; anything else keeps its text. */
export const toTrainingPeaksPushFailure = (
  error: unknown
): TrainingPeaksPushFailureOutcome => {
  if (statusOf(error) === TRAININGPEAKS_HORIZON_STATUS) {
    return { ok: false, reason: "horizon" };
  }
  if (!(error instanceof Error)) return { ok: false, reason: "not-answering" };
  return { ok: false, message: error.message };
};

type ProbedSession = {
  authenticated: boolean;
  athleteId?: number;
  needsReauth?: boolean;
};

/** The athlete id to write against, or why the push must stop here. An older
    extension omits `needsReauth`, so only `false` means "not answering". */
export const athleteIdOrRefusal = (
  session: ProbedSession
): { athleteId: number } | TrainingPeaksPushFailureOutcome => {
  if (!session.authenticated && session.needsReauth === false) {
    return { ok: false, reason: "not-answering" };
  }
  if (!session.authenticated || session.athleteId === undefined) {
    return { ok: false, reason: "sign-in" };
  }
  return { athleteId: session.athleteId };
};
