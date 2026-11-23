/**
 * TrainingPeaks bridge read transport.
 *
 * Relays `checkSession` to the discovered trainingpeaks-bridge extension.
 * The cookie→token exchange stays inside the extension; this layer holds no
 * credentials and only transports + validates the envelope. A dead
 * trainingpeaks.com session surfaces as `{ ok: false, needsReauth: true }`;
 * that flag rides the thrown `TrainingPeaksBridgeError` so the sync use case
 * can prompt a re-login instead of retrying.
 */
import { z } from "zod";

import { SESSION_OUTCOMES } from "../../application/connections/session-outcome";
import { sendBridgeMessage } from "../bridge/bridge-transport";

const CHECK_SESSION_TIMEOUT_MS = 5_000;

// The bridge answers `checkSession` with its whole BRIDGE_MANIFEST plus the
// typed outcome and its boolean; the non-strict object drops the manifest
// noise. An extension older than the cheap check also sends `athleteId` (the
// check minted a token to learn it) and `needsReauth`.
const trainingPeaksSessionSchema = z.object({
  authenticated: z.boolean(),
  session: z.enum(SESSION_OUTCOMES).optional(),
  athleteId: z.number().optional(),
  /** Absent from an older extension, which cannot tell the two apart. */
  needsReauth: z.boolean().optional(),
});

export type TrainingPeaksSession = z.infer<typeof trainingPeaksSessionSchema>;

export class TrainingPeaksBridgeError extends Error {
  readonly needsReauth: boolean;
  /** False when the extension never answered — it is gone, not signed out. */
  readonly delivered: boolean;
  /** TrainingPeaks' HTTP status, when the extension reported one. */
  readonly status: number | undefined;
  constructor(
    message: string,
    needsReauth = false,
    delivered = true,
    status?: number
  ) {
    super(message);
    this.name = "TrainingPeaksBridgeError";
    this.needsReauth = needsReauth;
    this.delivered = delivered;
    this.status = status;
  }
}

export const checkTrainingPeaksSession = async (
  extensionId: string
): Promise<TrainingPeaksSession> => {
  const res = await sendBridgeMessage(
    extensionId,
    { action: "checkSession" },
    CHECK_SESSION_TIMEOUT_MS
  );
  if (!res.ok) {
    throw new TrainingPeaksBridgeError(
      res.error ?? "TrainingPeaks session check failed",
      res.needsReauth === true,
      res.delivered !== false
    );
  }
  const parsed = trainingPeaksSessionSchema.safeParse(res.data);
  if (!parsed.success) {
    throw new TrainingPeaksBridgeError(
      "Malformed TrainingPeaks session response"
    );
  }
  return parsed.data;
};
