import { TRAININGPEAKS_HORIZON_STATUS } from "../application/trainingpeaks/trainingpeaks-planning-horizon";
import { logFailure } from "../lib/log-failure";

/**
 * Why a send stopped, worded by the App (`TrainingPeaksPushFeedback`):
 * TrainingPeaks refused the day (a 402), did not answer (no cause known), the
 * workout has no steps, the extension is missing, or the Session is gone.
 */
export type TrainingPeaksPushRefusal =
  "horizon" | "not-answering" | "no-steps" | "install" | "sign-in";

export type TrainingPeaksPushFailureOutcome = {
  ok: false;
  reason: TrainingPeaksPushRefusal;
};

type BridgeFailure = { status?: unknown; needsReauth?: unknown } | null;

/**
 * A 402 is TrainingPeaks refusing the day and `needsReauth` a gone Session;
 * any other failure has no verified cause, so TrainingPeaks is "not
 * answering". Its own text goes to the console, never to the athlete.
 */
export const toTrainingPeaksPushFailure = (
  error: unknown
): TrainingPeaksPushFailureOutcome => {
  const failure = error as BridgeFailure;
  if (failure?.status === TRAININGPEAKS_HORIZON_STATUS) {
    return { ok: false, reason: "horizon" };
  }
  logFailure("trainingpeaks-send", error);
  if (failure?.needsReauth === true) return { ok: false, reason: "sign-in" };
  return { ok: false, reason: "not-answering" };
};

type ProbedSession = {
  authenticated: boolean;
  athleteId?: number;
  needsReauth?: boolean;
};

/** The athlete id to write against, or why the push must stop here. Only
    TrainingPeaks' own refusal (`needsReauth: true`) may ask for a sign-in;
    any other unauthenticated answer — an older extension omits the flag — has
    no verified cause, so TrainingPeaks is "not answering". */
export const athleteIdOrRefusal = (
  session: ProbedSession
): { athleteId: number } | TrainingPeaksPushFailureOutcome => {
  if (!session.authenticated) {
    return {
      ok: false,
      reason: session.needsReauth === true ? "sign-in" : "not-answering",
    };
  }
  if (session.athleteId === undefined) {
    return { ok: false, reason: "not-answering" };
  }
  return { athleteId: session.athleteId };
};
