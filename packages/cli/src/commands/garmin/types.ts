import { z } from "zod";

export const loginOptionsSchema = z.object({
  email: z.string(),
  password: z.string(),
  verbose: z.boolean().optional(),
  quiet: z.boolean().optional(),
  json: z.boolean().optional(),
});

export const listOptionsSchema = z.object({
  limit: z.number().int().positive().optional().default(20),
  offset: z.number().int().nonnegative().optional().default(0),
  verbose: z.boolean().optional(),
  quiet: z.boolean().optional(),
  json: z.boolean().optional(),
});

export const pushOptionsSchema = z.object({
  input: z.string(),
  inputFormat: z.string().optional(),
  verbose: z.boolean().optional(),
  quiet: z.boolean().optional(),
  json: z.boolean().optional(),
});
