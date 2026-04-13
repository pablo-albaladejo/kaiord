/**
 * Usage Record Schema
 *
 * Zod schema for AI token usage tracking records.
 */

import { z } from "zod";

export const usageEntrySchema = z.object({
  date: z.iso.date(),
  tokens: z.number().int().nonnegative(),
  cost: z.number().nonnegative(),
});

export type UsageEntry = z.infer<typeof usageEntrySchema>;

export const usageRecordSchema = z.object({
  yearMonth: z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/),
  totalTokens: z.number().int().nonnegative(),
  totalCost: z.number().nonnegative(),
  entries: z.array(usageEntrySchema),
});

export type UsageRecord = z.infer<typeof usageRecordSchema>;
