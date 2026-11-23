import { z } from "zod";

import { AI_REQUEST_OUTCOMES } from "../../observability/telemetry-types";
import { LLM_PROVIDER_TYPES } from "../types";

const COUNT = z.number().int().nonnegative();

const usageSchema = z
  .object({
    promptTokens: COUNT,
    completionTokens: COUNT,
    cacheReadTokens: COUNT.optional(),
    cacheWriteTokens: COUNT.optional(),
  })
  .strict();

export const costBasisSchema = z.discriminatedUnion("kind", [
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
      reason: z.enum(["unknown_provider", "unknown_model", "unpriced_model"]),
    })
    .strict(),
]);

/**
 * What a run of the assistant cost (`priceRun`): every request that reached
 * the Provider, each priced on its own (a long-context tier applies per
 * request), summed. `usd` is null when the model's price is unknown. A
 * request with no usage (an error the Provider answered before any output)
 * is counted in `unmeasuredRequests` and adds nothing; a request cut before
 * the Provider reported its usage is priced at its estimate and counted in
 * `estimatedRequests`. A consumer storing a `RunCost` parses it with this.
 */
export const runCostSchema = z
  .object({
    provider: z.enum(LLM_PROVIDER_TYPES).optional(),
    modelId: z.string(),
    requests: z.array(
      z
        .object({
          outcome: z.enum(AI_REQUEST_OUTCOMES),
          usage: usageSchema.optional(),
          estimated: z.literal(true).optional(),
          usd: z.number().nonnegative().nullable(),
        })
        .strict()
    ),
    usage: usageSchema.required(),
    usd: z.number().nonnegative().nullable(),
    failedRequests: COUNT,
    unmeasuredRequests: COUNT,
    // A Trace stored before estimates existed has none.
    estimatedRequests: COUNT.default(0),
    basis: costBasisSchema,
  })
  .strict();

export type RunCost = z.infer<typeof runCostSchema>;
export type PricedRequest = RunCost["requests"][number];
export type CostBasis = z.infer<typeof costBasisSchema>;
