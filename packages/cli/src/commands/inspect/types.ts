import { z } from "zod";

export const inspectOptionsSchema = z.object({
  input: z.string(),
  inputFormat: z.string().optional(),
  verbose: z.boolean().optional(),
  quiet: z.boolean().optional(),
  json: z.boolean().optional(),
  logFormat: z.enum(["pretty", "structured"]).optional(),
});

export type InspectOptions = z.infer<typeof inspectOptionsSchema>;
