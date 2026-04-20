/**
 * Usage Record Schema
 *
 * Zod schemas for AI token usage tracking records. The
 * `inputTokens` / `outputTokens` split satisfies the spa-ai-batch
 * spec's granularity requirement for the usage panel.
 *
 * `totalTokens` is kept as a derived convenience (= input + output)
 * so existing readers don't break; the `.refine` invariant guards
 * against drift.
 *
 * `legacy` is set only on rows backfilled by the v2 → v3 Dexie
 * migration: those rows came from a pre-split write and the
 * `outputTokens: 0` value is a conservative default that the
 * renderer SHALL present as "—".
 */

import { z } from "zod";

export const usageEntrySchema = z
  .object({
    date: z.iso.date(),
    inputTokens: z.number().int().nonnegative(),
    outputTokens: z.number().int().nonnegative(),
    tokens: z.number().int().nonnegative(),
    cost: z.number().nonnegative(),
  })
  .refine((v) => v.tokens === v.inputTokens + v.outputTokens, {
    message: "tokens MUST equal inputTokens + outputTokens",
    path: ["tokens"],
  });

export type UsageEntry = z.infer<typeof usageEntrySchema>;

export const usageRecordSchema = z
  .object({
    yearMonth: z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/),
    inputTokens: z.number().int().nonnegative(),
    outputTokens: z.number().int().nonnegative(),
    totalTokens: z.number().int().nonnegative(),
    totalCost: z.number().nonnegative(),
    entries: z.array(usageEntrySchema),
    legacy: z.boolean().optional(),
  })
  .refine((v) => v.totalTokens === v.inputTokens + v.outputTokens, {
    message: "totalTokens MUST equal inputTokens + outputTokens",
    path: ["totalTokens"],
  });

export type UsageRecord = z.infer<typeof usageRecordSchema>;
