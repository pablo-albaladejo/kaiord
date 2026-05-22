import { type FileType, fileTypeSchema } from "@kaiord/core";

import { fitMessageKeySchema } from "../schemas/fit-message-keys";
import type { FitMessages } from "../shared/types";

/**
 * Ordered list of (message-key, file-type) pairs that identify a
 * health FIT file by the presence of its primary message stream. The
 * order encodes priority — the first detector that matches wins, so
 * a file carrying both `sleepLevelMesgs` and `monitoringMesgs` is
 * classified as `sleep_record`.
 *
 * Adding a new health category requires appending one row here plus
 * a switch arm in `mapMessagesToKRD` / `createFitMessages`.
 */
const HEALTH_DETECTORS: ReadonlyArray<readonly [string, FileType]> = [
  ["sleepLevelMesgs", fileTypeSchema.enum.sleep_record],
  ["bodyCompositionMesgs", fileTypeSchema.enum.body_composition],
  ["weightScaleMesgs", fileTypeSchema.enum.weight_measurement],
  ["hrvStatusSummaryMesgs", fileTypeSchema.enum.hrv_summary],
  ["hrvValueMesgs", fileTypeSchema.enum.hrv_summary],
  ["monitoringMesgs", fileTypeSchema.enum.daily_wellness],
  ["stressLevelMesgs", fileTypeSchema.enum.stress_episode],
];

export const detectFileType = (messages: FitMessages): FileType => {
  for (const [key, type] of HEALTH_DETECTORS) {
    const mesgs = messages[key];
    if (mesgs && mesgs.length > 0) return type;
  }

  const workoutMsgs = messages[fitMessageKeySchema.enum.workoutMesgs];
  if (workoutMsgs && workoutMsgs.length > 0)
    return fileTypeSchema.enum.structured_workout;

  const sessionMsgs = messages[fitMessageKeySchema.enum.sessionMesgs];
  const recordMsgs = messages[fitMessageKeySchema.enum.recordMesgs];
  if (
    (sessionMsgs && sessionMsgs.length > 0) ||
    (recordMsgs && recordMsgs.length > 0)
  ) {
    return fileTypeSchema.enum.recorded_activity;
  }

  return fileTypeSchema.enum.structured_workout;
};
