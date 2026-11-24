/**
 * The unanswered-send check wired to the App's ledger and Kaiord for
 * TrainingPeaks (`application/trainingpeaks/unanswered-send`): a send that
 * timed out after the extension had it is recorded with its day and title,
 * and the next send of the Workout reads that day first.
 */
import { NO_ANSWER_ERROR } from "../adapters/bridge/bridge-transport";
import { readTrainingPeaksDayTitles } from "../adapters/trainingpeaks/connector/trainingpeaks-day-transport";
import { computeExportHash } from "../application/export/record-export-analytics";
import { recordUnansweredSend } from "../application/trainingpeaks/record-unanswered-send";
import {
  checkUnansweredSend,
  type UnansweredVerdict,
} from "../application/trainingpeaks/unanswered-send";
import { logFailure } from "../lib/log-failure";
import { ledgerRepo, TRAININGPEAKS_BRIDGE_ID } from "./trainingpeaks-push-fn";

const depsFor = (extensionId: string) => ({
  ledgerRepo,
  destinationBridgeId: TRAININGPEAKS_BRIDGE_ID,
  days: {
    titlesOn: (day: string) => readTrainingPeaksDayTitles(extensionId, day),
  },
});

export const checkTrainingPeaksUnanswered = (
  extensionId: string,
  kaiordRecordId: string,
  sendAnyway: boolean
): Promise<UnansweredVerdict> =>
  checkUnansweredSend(depsFor(extensionId), kaiordRecordId, sendAnyway);

/** The send's answer never came: the extension had it, the App gave up. */
export const isUnansweredSend = (error: unknown): boolean => {
  const e = error as { delivered?: unknown; message?: unknown } | null;
  return e?.delivered === false && e?.message === NO_ANSWER_ERROR;
};

export const rememberUnansweredSend = async (
  extensionId: string,
  kaiordRecordId: string,
  payload: Record<string, unknown>
): Promise<void> => {
  const { workoutDay, title } = payload;
  if (typeof workoutDay !== "string" || typeof title !== "string") return;
  await recordUnansweredSend(depsFor(extensionId), kaiordRecordId, {
    day: workoutDay.slice(0, 10),
    title,
    at: new Date().toISOString(),
    contentHash: computeExportHash("workout", payload),
  });
};

/** After a failed send: remember it when its answer never came. A failure
    to remember is logged, never thrown over the send's own failure. */
export const rememberIfUnanswered = async (
  error: unknown,
  extensionId: string,
  kaiordRecordId: string,
  payload: Record<string, unknown> | undefined
): Promise<void> => {
  if (!payload || !isUnansweredSend(error)) return;
  await rememberUnansweredSend(extensionId, kaiordRecordId, payload).catch(
    (e: unknown) => logFailure("trainingpeaks-unanswered", e)
  );
};
