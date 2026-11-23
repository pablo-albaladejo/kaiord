import { TRAININGPEAKS_HORIZON_STATUS } from "../application/trainingpeaks/trainingpeaks-planning-horizon";

export type TrainingPeaksPushFailureOutcome =
  | { ok: false; message: string }
  /** TrainingPeaks refused the day (a 402), or did not answer: no cause known. */
  | { ok: false; reason: "horizon" | "not-answering" };

const statusOf = (error: unknown): unknown =>
  (error as { status?: unknown } | null)?.status;

/** A 402 is TrainingPeaks refusing the day; anything else keeps its text. */
export const toTrainingPeaksPushFailure = (
  error: unknown
): TrainingPeaksPushFailureOutcome => {
  if (statusOf(error) === TRAININGPEAKS_HORIZON_STATUS) {
    return { ok: false, reason: "horizon" };
  }
  const message =
    error instanceof Error ? error.message : "TrainingPeaks push failed";
  return { ok: false, message };
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
    return { ok: false, message: "Sign in to TrainingPeaks and retry" };
  }
  return { athleteId: session.athleteId };
};
