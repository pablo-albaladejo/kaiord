/**
 * Reads `consolidatedtimedmetrics` for a date range. `start`/`end` are
 * `YYYY-MM-DD` path segments, the athlete id comes from the extension's
 * `read-athlete-id`, and consecutive reads are paced. Through `request`
 * (protocol 2) the raw JSON is read here; through the legacy `read-metrics`
 * (protocol 1) the extension relays it. Either way it is returned unparsed —
 * the shape is validated by `trainingPeaksMetricsToKrd`, which accepts
 * `unknown`.
 */
import { sendBridgeMessage } from "../bridge/bridge-transport";
import { callThroughBridge } from "../bridge/thin-bridge-request";
import { readJson } from "./connector/read-trainingpeaks-answers";
import { metricsPath } from "./connector/trainingpeaks-paths";
import { createReadPacing } from "./connector/trainingpeaks-read-pacing";
import { readTrainingPeaksAthleteId } from "./trainingpeaks-athlete-transport";
import { TrainingPeaksBridgeError } from "./trainingpeaks-transport";

const READ_METRICS_TIMEOUT_MS = 30_000;
const spaceReads = createReadPacing();

export const readTrainingPeaksMetrics = async (
  extensionId: string,
  start: string,
  end: string
): Promise<unknown> => {
  const athleteId = await readTrainingPeaksAthleteId(extensionId);
  await spaceReads();
  const res = await callThroughBridge(
    (message) =>
      sendBridgeMessage(extensionId, message, READ_METRICS_TIMEOUT_MS),
    {
      method: "GET",
      path: metricsPath(athleteId, start, end),
      legacy: { action: "read-metrics", start, end, athleteId },
      read: readJson,
    }
  );
  if (!res.ok) {
    throw new TrainingPeaksBridgeError(
      res.error ?? "TrainingPeaks metrics read failed",
      res.needsReauth === true,
      res.delivered !== false
    );
  }
  return res.data;
};
