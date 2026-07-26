/**
 * TrainingPeaks bridge read transport.
 *
 * Relays `checkSession` / `read-metrics` to the discovered trainingpeaks-bridge
 * extension. The cookie→token exchange stays inside the extension; this layer
 * holds no credentials and only transports + validates the envelope. A dead
 * trainingpeaks.com session surfaces as `{ ok: false, needsReauth: true }`;
 * that flag rides the thrown `TrainingPeaksBridgeError` so the sync use case
 * can prompt a re-login instead of retrying. Modeled on `tanita-transport.ts`.
 */
import { z } from "zod";

import { sendBridgeMessage } from "../bridge/bridge-transport";

const CHECK_SESSION_TIMEOUT_MS = 5_000;
const READ_METRICS_TIMEOUT_MS = 30_000;

// The bridge answers `checkSession` with its whole BRIDGE_MANIFEST plus these
// two keys; the non-strict object drops the manifest noise.
const trainingPeaksSessionSchema = z.object({
  authenticated: z.boolean(),
  athleteId: z.number().optional(),
});

export type TrainingPeaksSession = z.infer<typeof trainingPeaksSessionSchema>;

export class TrainingPeaksBridgeError extends Error {
  readonly needsReauth: boolean;
  constructor(message: string, needsReauth = false) {
    super(message);
    this.name = "TrainingPeaksBridgeError";
    this.needsReauth = needsReauth;
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
      res.needsReauth === true
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

/**
 * Reads `consolidatedtimedmetrics` for a date range. `start`/`end` are `YYYY-MM-DD`
 * path segments. The raw JSON is returned unparsed — the shape is validated by
 * `trainingPeaksMetricsToKrd` in @kaiord/trainingpeaks, which accepts `unknown`.
 */
export const readTrainingPeaksMetrics = async (
  extensionId: string,
  start: string,
  end: string
): Promise<unknown> => {
  const res = await sendBridgeMessage(
    extensionId,
    { action: "read-metrics", start, end },
    READ_METRICS_TIMEOUT_MS
  );
  if (!res.ok) {
    throw new TrainingPeaksBridgeError(
      res.error ?? "TrainingPeaks metrics read failed",
      res.needsReauth === true
    );
  }
  return res.data;
};
