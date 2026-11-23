import { priceRun } from "@kaiord/ai/providers";

import type { UsageEventRecord } from "../../types/usage-event-schemas";

/**
 * A usage row's cost in USD, or null when its model's price is unknown. A row
 * written before per-model pricing (no `costBasis`) carries a blended-rate
 * cost; it is priced again here from its own model and tokens, as one
 * request on the day it was written. Its `promptTokens` counted cached
 * input too, which it did not record apart, so a cached run is priced as if
 * uncached: higher than it was billed, and not recoverable.
 */
export const costOfRow = (row: UsageEventRecord): number | null => {
  if (row.costBasis === "price_table") return row.cost;
  if (row.costBasis === "unknown") return null;
  const usage = {
    promptTokens: row.promptTokens,
    completionTokens: row.completionTokens,
  };
  return priceRun({
    provider: row.providerType,
    modelId: row.modelId ?? "",
    requests: [{ outcome: "ok", usage }],
    at: new Date(row.createdAt),
  }).usd;
};
