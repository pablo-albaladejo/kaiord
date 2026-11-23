import { z } from "zod";

const usageSchema = z
  .object({
    promptTokens: z.number().int().nonnegative(),
    completionTokens: z.number().int().nonnegative(),
    cacheReadTokens: z.number().int().nonnegative().optional(),
    cacheWriteTokens: z.number().int().nonnegative().optional(),
  })
  .strict();

const outcomeSchema = z.enum([
  "ok",
  "invalid",
  "truncated",
  "error",
  "stopped",
]);

/** `priceRun`'s `RunCost` (`@kaiord/ai/providers`), as a Trace stores it. */
export const runCostSchema = z
  .object({
    provider: z.enum(["anthropic", "openai", "google"]).optional(),
    modelId: z.string(),
    requests: z.array(
      z
        .object({
          outcome: outcomeSchema,
          usage: usageSchema.optional(),
          usd: z.number().nonnegative().nullable(),
        })
        .strict()
    ),
    usage: usageSchema.required(),
    usd: z.number().nonnegative().nullable(),
    failedRequests: z.number().int().nonnegative(),
    unmeasuredRequests: z.number().int().nonnegative(),
    basis: z.discriminatedUnion("kind", [
      z
        .object({
          kind: z.literal("price_table"),
          source: z.string(),
          readOn: z.string(),
        })
        .strict(),
      z
        .object({
          kind: z.literal("unknown"),
          reason: z.enum([
            "unknown_provider",
            "unknown_model",
            "unpriced_model",
          ]),
        })
        .strict(),
    ]),
  })
  .strict();
