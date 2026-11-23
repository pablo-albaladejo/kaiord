/**
 * The TrainingPeaks athlete id a write is built against, read when the Kaiord
 * App is about to send. This is where the extension mints its token, because
 * a write follows; the Session check mints nothing and names no athlete.
 *
 * An extension older than the cheap check refuses the action and is asked
 * through its own session check instead, which still answers the id. Its
 * `needsReauth` absent means it could not tell, so only `false` means
 * "TrainingPeaks did not answer".
 */
import { z } from "zod";

import { sendBridgeMessage } from "../bridge/bridge-transport";
import {
  checkTrainingPeaksSession,
  TrainingPeaksBridgeError,
} from "./trainingpeaks-transport";

const READ_ATHLETE_TIMEOUT_MS = 15_000;
const OLDER_EXTENSION = "Origin or action not permitted";
const NO_ATHLETE = "TrainingPeaks named no athlete";

const athleteSchema = z.object({ athleteId: z.number() });

const readFromOlderExtension = async (extensionId: string): Promise<number> => {
  const session = await checkTrainingPeaksSession(extensionId);
  if (session.authenticated && session.athleteId !== undefined) {
    return session.athleteId;
  }
  throw new TrainingPeaksBridgeError(NO_ATHLETE, session.needsReauth !== false);
};

export const readTrainingPeaksAthleteId = async (
  extensionId: string
): Promise<number> => {
  const res = await sendBridgeMessage(
    extensionId,
    { action: "read-athlete-id" },
    READ_ATHLETE_TIMEOUT_MS
  );
  if (!res.ok && res.error === OLDER_EXTENSION) {
    return readFromOlderExtension(extensionId);
  }
  if (!res.ok) {
    throw new TrainingPeaksBridgeError(
      res.error ?? NO_ATHLETE,
      res.needsReauth === true,
      res.delivered !== false,
      res.status
    );
  }
  const parsed = athleteSchema.safeParse(res.data);
  if (!parsed.success) throw new TrainingPeaksBridgeError(NO_ATHLETE);
  return parsed.data.athleteId;
};
