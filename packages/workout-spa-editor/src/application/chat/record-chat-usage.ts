/**
 * recordChatUsage — fold one chat turn's token usage into the monthly
 * `usage` row, so chat consumption appears in the existing usage panel
 * alongside generation. Reads-modifies-writes inside one transaction. Cost
 * reuses the same blended provider rate as the batch cost estimate.
 */
import type { PersistencePort } from "../../ports/persistence-port";
import type { LlmProviderType } from "../../store/ai-store-types";
import type { UsageRecord } from "../../types/usage-schemas";
import { estimateCost } from "../cost-estimation";
import { getProviderRate } from "../provider-rates";

export type RecordChatUsageInput = {
  providerType: LlmProviderType;
  promptTokens: number;
  completionTokens: number;
};

const emptyMonth = (yearMonth: string): UsageRecord => ({
  yearMonth,
  inputTokens: 0,
  outputTokens: 0,
  totalTokens: 0,
  totalCost: 0,
  entries: [],
});

export const recordChatUsage = async (
  persistence: PersistencePort,
  input: RecordChatUsageInput,
  now: () => Date = () => new Date()
): Promise<void> => {
  const date = now().toISOString().slice(0, 10);
  const yearMonth = date.slice(0, 7);
  const tokens = input.promptTokens + input.completionTokens;
  if (tokens === 0) return;
  const cost = estimateCost(tokens, getProviderRate(input.providerType));

  await persistence.transaction(async () => {
    const prior =
      (await persistence.usage.getByMonth(yearMonth)) ?? emptyMonth(yearMonth);
    await persistence.usage.put({
      yearMonth,
      inputTokens: prior.inputTokens + input.promptTokens,
      outputTokens: prior.outputTokens + input.completionTokens,
      totalTokens: prior.totalTokens + tokens,
      totalCost: prior.totalCost + cost,
      entries: [
        ...prior.entries,
        {
          date,
          inputTokens: input.promptTokens,
          outputTokens: input.completionTokens,
          tokens,
          cost,
        },
      ],
      ...(prior.legacy !== undefined ? { legacy: prior.legacy } : {}),
    });
  });
};
