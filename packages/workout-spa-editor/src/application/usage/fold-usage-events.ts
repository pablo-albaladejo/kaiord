/**
 * foldUsageEvents — pure reduction of usage events into totals for the usage
 * panel. Events are summed in `createdAt` ascending order so the
 * floating-point cost accumulation is deterministic regardless of read order.
 * An optional `purpose` filter scopes the fold (e.g. chat-only) for the
 * per-purpose breakdown. A run whose model has no price adds nothing to
 * `totalCost` and is counted in `unknownCostRuns`, so the panel can say the
 * total leaves it out instead of showing it as free.
 */
import type { AiModelPurpose } from "../../types/ai-model-binding";
import type { UsageEventRecord } from "../../types/usage-event-schemas";
import { costOfRow } from "./row-cost";

export type UsageTotals = {
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  totalCost: number;
  unknownCostRuns: number;
  failedRequests: number;
  unmeasuredRequests: number;
};

export type FoldUsageEventsOptions = {
  purpose?: AiModelPurpose;
};

const EMPTY: UsageTotals = {
  inputTokens: 0,
  outputTokens: 0,
  totalTokens: 0,
  totalCost: 0,
  unknownCostRuns: 0,
  failedRequests: 0,
  unmeasuredRequests: 0,
};

const byCreatedAt = (a: UsageEventRecord, b: UsageEventRecord) =>
  a.createdAt < b.createdAt ? -1 : a.createdAt > b.createdAt ? 1 : 0;

const add = (totals: UsageTotals, e: UsageEventRecord): UsageTotals => {
  const cost = costOfRow(e);
  return {
    inputTokens: totals.inputTokens + e.promptTokens,
    outputTokens: totals.outputTokens + e.completionTokens,
    totalTokens: totals.totalTokens + e.tokens,
    totalCost: totals.totalCost + (cost ?? 0),
    unknownCostRuns: totals.unknownCostRuns + (cost === null ? 1 : 0),
    failedRequests: totals.failedRequests + (e.failedRequests ?? 0),
    unmeasuredRequests: totals.unmeasuredRequests + (e.unmeasuredRequests ?? 0),
  };
};

export const foldUsageEvents = (
  events: ReadonlyArray<UsageEventRecord>,
  options: FoldUsageEventsOptions = {}
): UsageTotals => {
  const scoped = options.purpose
    ? events.filter((e) => e.purpose === options.purpose)
    : events;
  return [...scoped].sort(byCreatedAt).reduce(add, EMPTY);
};

export type ModelUsage = {
  providerType?: UsageEventRecord["providerType"];
  modelId?: string;
  runs: number;
  totals: UsageTotals;
};

/** One entry per Provider and model, the most expensive first. */
export const foldUsageByModel = (
  events: ReadonlyArray<UsageEventRecord>
): ModelUsage[] => {
  const groups = new Map<string, UsageEventRecord[]>();
  for (const e of events) {
    const key = `${e.providerType ?? ""}/${e.modelId ?? ""}`;
    groups.set(key, [...(groups.get(key) ?? []), e]);
  }
  return [...groups.values()]
    .map((rows) => ({
      providerType: rows[0]!.providerType,
      modelId: rows[0]!.modelId,
      runs: rows.length,
      totals: foldUsageEvents(rows),
    }))
    .sort((a, b) => b.totals.totalCost - a.totals.totalCost);
};
