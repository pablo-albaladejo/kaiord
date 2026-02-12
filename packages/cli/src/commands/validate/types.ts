import { z } from "zod";

export const validateOptionsSchema = z.object({
  input: z.string(),
  toleranceConfig: z.string().optional(),
  verbose: z.boolean().optional(),
  quiet: z.boolean().optional(),
  json: z.boolean().optional(),
  logFormat: z.enum(["pretty", "structured"]).optional(),
});

export type ValidateOptions = z.infer<typeof validateOptionsSchema>;
