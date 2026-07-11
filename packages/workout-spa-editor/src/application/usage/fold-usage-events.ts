/**
 * foldUsageEvents — pure reduction of a month's usage events into per-month
 * totals for the usage panel. Events are summed in `createdAt` ascending order
 * so the floating-point cost accumulation is deterministic regardless of read
 * order. An optional `purpose` filter scopes the fold (e.g. chat-only) for the
 * per-purpose breakdown.
 */
import type { AiModelPurpose } from "../../types/ai-model-binding";
import type { UsageEventRecord } from "../../types/usage-event-schemas";

export type UsageTotals = {
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  totalCost: number;
};

export type FoldUsageEventsOptions = {
  purpose?: AiModelPurpose;
};

export const foldUsageEvents = (
  events: ReadonlyArray<UsageEventRecord>,
  options: FoldUsageEventsOptions = {}
): UsageTotals => {
  const scoped = options.purpose
    ? events.filter((e) => e.purpose === options.purpose)
    : events;
  const ordered = [...scoped].sort((a, b) =>
    a.createdAt < b.createdAt ? -1 : a.createdAt > b.createdAt ? 1 : 0
  );

  return ordered.reduce<UsageTotals>(
    (totals, e) => ({
      inputTokens: totals.inputTokens + e.promptTokens,
      outputTokens: totals.outputTokens + e.completionTokens,
      totalTokens: totals.totalTokens + e.tokens,
      totalCost: totals.totalCost + e.cost,
    }),
    { inputTokens: 0, outputTokens: 0, totalTokens: 0, totalCost: 0 }
  );
};
