import { z } from "zod";

export const fitMessageKeySchema = z.enum([
  "fileIdMesgs",
  "workoutMesgs",
  "workoutStepMesgs",
  "sessionMesgs",
  "recordMesgs",
  "eventMesgs",
  "lapMesgs",
  // Health domain (KRD v2.0)
  "sleepLevelMesgs",
  "monitoringMesgs",
  "monitoringInfoMesgs",
  "weightScaleMesgs",
  "bodyCompositionMesgs",
  "hrvStatusSummaryMesgs",
  "hrvValueMesgs",
  "stressLevelMesgs",
]);

export type FitMessageKey = z.infer<typeof fitMessageKeySchema>;
