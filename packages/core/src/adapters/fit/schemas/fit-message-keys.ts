import { z } from "zod";

export const fitMessageKeyEnum = z.enum([
  "fileIdMesgs",
  "workoutMesgs",
  "workoutStepMesgs",
]);

export type FitMessageKey = z.infer<typeof fitMessageKeyEnum>;
