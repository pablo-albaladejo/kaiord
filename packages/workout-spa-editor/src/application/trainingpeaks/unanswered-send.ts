/**
 * A send to TrainingPeaks whose answer never arrived may have landed:
 * TrainingPeaks is create-only for Kaiord, and sending again would add a
 * second copy. So the record keeps that send (`unansweredSend`: its day and
 * title), and the next send of the Workout reads that day first
 * (`readLiveState`, the shared safe-write decision): a workout of the same
 * title there stops it and asks the athlete; a read that fails stops it
 * and says Kaiord could not check; none, in two reads `SETTLE_MS` apart as
 * Garmin's placement confirms an absence, lets it through: TrainingPeaks
 * may commit the unanswered send after the App gave up on it. The entry found is
 * never touched. "Send anyway" goes through without reading. Letting a
 * send through forgets the unanswered one: a first send's pending row is
 * removed, a recorded copy only loses the mark.
 */
import type { ExportLedgerEntry } from "../../types/export-ledger";
import type { ExportLedgerRepository } from "../export/export-ledger-repository.port";
import { type LiveState, readLiveState } from "../safe-writes/live-state";
import type { TrainingPeaksDayPort } from "./trainingpeaks-day-port";

export type UnansweredDeps = {
  ledgerRepo: ExportLedgerRepository;
  destinationBridgeId: string;
  days: TrainingPeaksDayPort;
  sleep: (ms: number) => Promise<void>;
};

/** How long an absence waits for its confirming second read. */
export const SETTLE_MS = 3_000;

export type UnansweredVerdict =
  | { blocked: false }
  | { blocked: true; reason: "may-be-there" | "unchecked"; date: string };

export const keyOf = (deps: UnansweredDeps, kaiordRecordId: string) => ({
  kaiordRecordId,
  destinationBridgeId: deps.destinationBridgeId,
});

const sameTitle = (a: string, b: string) => a.trim() === b.trim();

const forget = async (deps: UnansweredDeps, row: ExportLedgerEntry) => {
  if (row.destinationExternalId === "pending") {
    await deps.ledgerRepo.rollbackPending(row.id);
    return;
  }
  await deps.ledgerRepo.mutateByKey(keyOf(deps, row.kaiordRecordId), (r) => {
    if (!r?.unansweredSend) return undefined;
    const rest = { ...r };
    delete rest.unansweredSend;
    return rest;
  });
};

export const checkUnansweredSend = async (
  deps: UnansweredDeps,
  kaiordRecordId: string,
  sendAnyway: boolean
): Promise<UnansweredVerdict> => {
  const row = await deps.ledgerRepo.findByNaturalKey(
    keyOf(deps, kaiordRecordId)
  );
  const sent = row?.unansweredSend;
  if (!row || !sent) return { blocked: false };
  if (!sendAnyway) {
    const { state } = await readLiveState(
      async () => {
        const read = await deps.days.titlesOn(sent.day);
        const found =
          read.ok && read.titles.some((t) => sameTitle(t, sent.title));
        const live: LiveState = !read.ok
          ? "unknown"
          : found
            ? "present"
            : "absent";
        return { state: live };
      },
      { ms: SETTLE_MS, sleep: deps.sleep }
    );
    if (state === "present")
      return { blocked: true, reason: "may-be-there", date: sent.day };
    if (state === "unknown")
      return { blocked: true, reason: "unchecked", date: sent.day };
  }
  await forget(deps, row);
  return { blocked: false };
};
