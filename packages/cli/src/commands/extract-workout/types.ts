import { z } from "zod";
import { fileFormatSchema } from "../../utils/format-detector.js";

export const extractWorkoutOptionsSchema = z.object({
  input: z.string(),
  inputFormat: fileFormatSchema.optional(),
  verbose: z.boolean().optional(),
  quiet: z.boolean().optional(),
  logFormat: z.enum(["pretty", "structured"]).optional(),
});

export type ExtractWorkoutOptions = z.infer<typeof extractWorkoutOptionsSchema>;
