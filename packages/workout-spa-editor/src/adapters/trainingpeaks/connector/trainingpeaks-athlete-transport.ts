/**
 * The TrainingPeaks athlete id a write is built against, read when the Kaiord
 * App is about to send. This is where the extension mints its token, because
 * a write follows; the Session check mints nothing and names no athlete.
 *
 * An extension one protocol behind does not know the action and is asked
 * through its own session check instead, which still answers the id. Only
 * its `needsReauth: true` says TrainingPeaks ended the Session; absent, it
 * could not tell.
 */
import { z } from "zod";

import { sendBridgeMessage } from "../../bridge/bridge-transport";
import { answerOrThrow } from "../../bridge/connector-call";
import { speaksPreviousProtocol } from "../../bridge/thin-bridge-request";
import {
  checkTrainingPeaksSession,
  TrainingPeaksBridgeError,
  trainingPeaksError,
} from "./trainingpeaks-transport";

const READ_ATHLETE_TIMEOUT_MS = 15_000;
const NO_ATHLETE = "TrainingPeaks named no athlete";

const athleteSchema = z.object({ athleteId: z.number() });

const readFromOlderExtension = async (extensionId: string): Promise<number> => {
  const session = await checkTrainingPeaksSession(extensionId);
  if (session.authenticated && session.athleteId !== undefined) {
    return session.athleteId;
  }
  throw new TrainingPeaksBridgeError(NO_ATHLETE, session.needsReauth === true);
};

export const readTrainingPeaksAthleteId = async (
  extensionId: string
): Promise<number> => {
  const res = await sendBridgeMessage(
    extensionId,
    { action: "read-athlete-id" },
    READ_ATHLETE_TIMEOUT_MS
  );
  if (!res.ok && speaksPreviousProtocol(res)) {
    return readFromOlderExtension(extensionId);
  }
  answerOrThrow(res, NO_ATHLETE, trainingPeaksError(true));
  const parsed = athleteSchema.safeParse(res.data);
  if (!parsed.success) throw new TrainingPeaksBridgeError(NO_ATHLETE);
  return parsed.data.athleteId;
};
