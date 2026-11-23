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
 * string maps to no `LlmProviderType` still records its usage.
 *
 * `cost` is priced per request at the model's own prices (`priceRun` from
 * `@kaiord/ai/providers`), failed attempts included. `costBasis` says how:
 * `price_table` (read on `priceReadOn`) or `unknown` (the model has no price,
 * so the row has no `cost` and the App shows it as unknown). The request counts say
 * how many requests reached the Provider, how many failed, how many reported
 * no usage (unmeasured, not counted) and how many were cut before the
 * Provider reported it (priced at an estimate). A row written before these
 * fields existed has none of them and was priced at a blended rate; the fold
 * prices it again per model.
 */

import { LLM_PROVIDER_TYPES } from "@kaiord/ai/providers";
import { z } from "zod";

export const usageEventSchema = z
  .object({
    id: z.string(),
    yearMonth: z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/),
    date: z.iso.date(),
    purpose: z.string(),
    providerType: z.enum(LLM_PROVIDER_TYPES).optional(),
    modelId: z.string().optional(),
    promptTokens: z.number().int().nonnegative(),
    completionTokens: z.number().int().nonnegative(),
    tokens: z.number().int().nonnegative(),
    cacheReadTokens: z.number().int().nonnegative().optional(),
    cacheWriteTokens: z.number().int().nonnegative().optional(),
    cost: z.number().nonnegative().optional(),
    costBasis: z.enum(["price_table", "unknown"]).optional(),
    priceReadOn: z.iso.date().optional(),
    requestCount: z.number().int().nonnegative().optional(),
    failedRequests: z.number().int().nonnegative().optional(),
    unmeasuredRequests: z.number().int().nonnegative().optional(),
    estimatedRequests: z.number().int().nonnegative().optional(),
    createdAt: z.string(),
  })
  .strict()
  .refine((v) => v.tokens === v.promptTokens + v.completionTokens, {
    message: "tokens MUST equal promptTokens + completionTokens",
    path: ["tokens"],
  })
  .refine((v) => (v.cost === undefined) === (v.costBasis === "unknown"), {
    message: "a row has a cost unless its price is unknown",
    path: ["cost"],
  });

export type UsageEventRecord = z.infer<typeof usageEventSchema>;
