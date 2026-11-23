import type { AiRequest, AiUsage } from "../../observability/telemetry-types";
import { sumUsage } from "../../observability/sum-usage";
import type { LlmProviderType } from "../types";
import { findModelPrice, periodAt, type PricePeriod } from "./price-table";
import type { RunCost } from "./run-cost-schema";

const PER_MILLION = 1_000_000;
// A request the athlete stopped did not fail; it is billed all the same.
const FAILED = new Set<AiRequest["outcome"]>(["invalid", "truncated", "error"]);

export type PriceRunInput = {
  provider?: LlmProviderType;
  modelId: string;
  requests: readonly AiRequest[];
  at: Date;
};

const priceRequest = (period: PricePeriod, usage: AiUsage): number => {
  const read = usage.cacheReadTokens ?? 0;
  const write = usage.cacheWriteTokens ?? 0;
  const long = period.longContext;
  const p = long && usage.promptTokens > long.aboveInputTokens ? long : period;
  const uncached = Math.max(0, usage.promptTokens - read - write);
  const micro =
    uncached * p.input +
    read * (p.cacheRead ?? p.input) +
    write * (p.cacheWrite ?? p.input) +
    usage.completionTokens * p.output;
  return micro / PER_MILLION;
};

const basisOf = (input: PriceRunInput) => {
  if (!input.provider)
    return { basis: { kind: "unknown", reason: "unknown_provider" } as const };
  const entry = findModelPrice(input.provider, input.modelId);
  if (!entry)
    return { basis: { kind: "unknown", reason: "unknown_model" } as const };
  if (!entry.periods)
    return { basis: { kind: "unknown", reason: "unpriced_model" } as const };
  const basis = {
    kind: "price_table",
    source: entry.source,
    readOn: entry.readOn,
  } as const;
  return { basis, period: periodAt(entry.periods, input.at) };
};

export const priceRun = (input: PriceRunInput): RunCost => {
  const { basis, period } = basisOf(input);
  const requests = input.requests.map((r) => ({
    ...r,
    usd: period && r.usage ? priceRequest(period, r.usage) : null,
  }));
  const usd = period
    ? requests.reduce((sum, r) => sum + (r.usd ?? 0), 0)
    : null;
  return {
    ...(input.provider ? { provider: input.provider } : {}),
    modelId: input.modelId,
    requests,
    usage: sumUsage(input.requests),
    usd,
    failedRequests: input.requests.filter((r) => FAILED.has(r.outcome)).length,
    unmeasuredRequests: input.requests.filter((r) => !r.usage).length,
    estimatedRequests: input.requests.filter((r) => r.estimated).length,
    basis,
  };
};
