import { z } from "zod";
import { fileFormatSchema } from "../../utils/format-detector.js";

export const inspectOptionsSchema = z.object({
  input: z.string(),
  inputFormat: fileFormatSchema.optional(),
  verbose: z.boolean().optional(),
  quiet: z.boolean().optional(),
  json: z.boolean().optional(),
  logFormat: z.enum(["pretty", "structured"]).optional(),
});

export type InspectOptions = z.infer<typeof inspectOptionsSchema>;
