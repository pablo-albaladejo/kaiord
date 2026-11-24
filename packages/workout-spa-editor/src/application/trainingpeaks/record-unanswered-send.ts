/**
 * Records a send to TrainingPeaks whose answer never arrived
 * (`unanswered-send`): on the copy Kaiord recorded, as a mark; on a first
 * send, as the pending row its rollback removed, so the next send of that
 * Workout reads the day first.
 */
import { keyOf, type UnansweredDeps } from "./unanswered-send";

export type UnansweredSendInput = {
  day: string;
  title: string;
  at: string;
  contentHash: string;
};

export const recordUnansweredSend = async (
  deps: UnansweredDeps,
  kaiordRecordId: string,
  input: UnansweredSendInput
): Promise<void> => {
  const unansweredSend = { day: input.day, title: input.title, at: input.at };
  await deps.ledgerRepo.mutateByKey(keyOf(deps, kaiordRecordId), (row) =>
    row
      ? { ...row, unansweredSend }
      : {
          id: crypto.randomUUID(),
          kaiordRecordId,
          dataType: "workout",
          destinationBridgeId: deps.destinationBridgeId,
          destinationExternalId: "pending",
          contentHash: input.contentHash,
          exportedAt: input.at,
          updatedAt: input.at,
          unansweredSend,
        }
  );
};
