import { z } from "zod";

export const extractWorkoutOptionsSchema = z.object({
  input: z.string(),
  inputFormat: z.string().optional(),
  verbose: z.boolean().optional(),
  quiet: z.boolean().optional(),
  logFormat: z.enum(["pretty", "structured"]).optional(),
});

export type ExtractWorkoutOptions = z.infer<typeof extractWorkoutOptionsSchema>;
