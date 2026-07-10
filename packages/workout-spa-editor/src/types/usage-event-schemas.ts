/**
 * Usage Event Schema
 *
 * Append-only, redaction-safe log of one AI run's token usage. Carries
 * identifiers and metrics only — no prompts, document bytes, model output, or
 * credentials exist as fields, so payload capture is impossible by
 * construction. Folded into monthly totals by `foldUsageEvents`; the
 * `[yearMonth+purpose]` Dexie index drives that read.
 *
 * `providerType` and `modelId` are optional: a runtime event whose SDK provider
 * string maps to no `LlmProviderType` records usage with `cost: 0` rather than
 * dropping it, and the chat path has no model id at its layer. Neither field is
 * used by the fold.
 */

import { z } from "zod";

export const usageEventSchema = z
  .object({
    id: z.string(),
    traceId: z.string().optional(),
    yearMonth: z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/),
    date: z.iso.date(),
    purpose: z.string(),
    providerType: z.enum(["anthropic", "openai", "google"]).optional(),
    modelId: z.string().optional(),
    promptTokens: z.number().int().nonnegative(),
    completionTokens: z.number().int().nonnegative(),
    tokens: z.number().int().nonnegative(),
    cost: z.number().nonnegative(),
    createdAt: z.string(),
  })
  .refine((v) => v.tokens === v.promptTokens + v.completionTokens, {
    message: "tokens MUST equal promptTokens + completionTokens",
    path: ["tokens"],
  });

export type UsageEventRecord = z.infer<typeof usageEventSchema>;
