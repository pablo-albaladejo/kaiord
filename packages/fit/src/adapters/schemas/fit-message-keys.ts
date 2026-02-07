import { z } from "zod";

export const fitMessageKeySchema = z.enum([
  "fileIdMesgs",
  "workoutMesgs",
  "workoutStepMesgs",
  "sessionMesgs",
  "recordMesgs",
  "eventMesgs",
  "lapMesgs",
]);

export type FitMessageKey = z.infer<typeof fitMessageKeySchema>;
