import {
  findModelPrice,
  type LlmProviderType,
  periodAt,
} from "@kaiord/ai/providers";

/** What a model's cost is computed from, as the athlete is shown it. */
export type PriceBasis =
  | {
      kind: "priced";
      /** USD per 1M tokens, in force on the day asked about. */
      input: number;
      output: number;
      cacheRead?: number;
      source: string;
      readOn: string;
    }
  | { kind: "unknown" };

export const priceBasisOf = (
  providerType: LlmProviderType | undefined,
  modelId: string | undefined,
  at: Date = new Date()
): PriceBasis => {
  const entry =
    providerType && modelId ? findModelPrice(providerType, modelId) : undefined;
  if (!entry?.periods) return { kind: "unknown" };
  const period = periodAt(entry.periods, at);
  return {
    kind: "priced",
    input: period.input,
    output: period.output,
    ...(period.cacheRead !== undefined ? { cacheRead: period.cacheRead } : {}),
    source: entry.source,
    readOn: entry.readOn,
  };
};
