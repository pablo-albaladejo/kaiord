import { z } from "zod";

export const fitMessageKeySchema = z.enum([
  "fileIdMesgs",
  "workoutMesgs",
  "workoutStepMesgs",
]);

export type FitMessageKey = z.infer<typeof fitMessageKeySchema>;
