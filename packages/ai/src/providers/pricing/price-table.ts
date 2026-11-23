import { z } from "zod";

import type { LlmProviderType } from "../types";
import table from "./model-prices.json";

const USD_PER_MTOK = z.number().nonnegative();
const ISO_DATE = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

const tokenPricesSchema = z
  .object({
    input: USD_PER_MTOK,
    output: USD_PER_MTOK,
    cacheRead: USD_PER_MTOK.optional(),
    cacheWrite: USD_PER_MTOK.optional(),
  })
  .strict();

const periodSchema = tokenPricesSchema
  .extend({
    from: ISO_DATE.optional(),
    longContext: tokenPricesSchema
      .extend({ aboveInputTokens: z.number().int().positive() })
      .strict()
      .optional(),
  })
  .strict();

const entrySchema = z
  .object({
    provider: z.enum(["anthropic", "openai", "google"]),
    ids: z.array(z.string()).min(1),
    source: z.url(),
    readOn: ISO_DATE,
    note: z.string().optional(),
    periods: z
      .array(periodSchema)
      .min(1)
      .refine(
        (ps) =>
          ps[0]!.from === undefined &&
          ps
            .slice(1)
            .every(
              (p, i) => p.from !== undefined && p.from > (ps[i]!.from ?? "")
            ),
        {
          message:
            "the first period is open and the next start in ascending order",
        }
      )
      .optional(),
    unpriced: z.string().optional(),
  })
  .strict()
  .refine((e) => (e.periods === undefined) !== (e.unpriced === undefined), {
    message: "an entry has either periods or an unpriced reason",
  });

/**
 * USD per 1M tokens. A missing `cacheRead` or `cacheWrite` means the
 * Provider bills those tokens as ordinary input.
 */
export type TokenPrices = z.infer<typeof tokenPricesSchema>;
export type PricePeriod = z.infer<typeof periodSchema>;
export type ModelPriceEntry = z.infer<typeof entrySchema>;

/**
 * The price table, read from each Provider's official pricing page. Parsed
 * once at load, so a malformed entry fails every test instead of pricing a
 * run wrong.
 */
export const MODEL_PRICES: readonly ModelPriceEntry[] = z
  .object({ unit: z.string(), entries: z.array(entrySchema) })
  .parse(table).entries;

export const findModelPrice = (
  provider: LlmProviderType,
  modelId: string
): ModelPriceEntry | undefined =>
  MODEL_PRICES.find((e) => e.provider === provider && e.ids.includes(modelId));

/** The period in force on `at` (UTC day): the last one starting on or before it. */
export const periodAt = (
  periods: readonly PricePeriod[],
  at: Date
): PricePeriod => {
  const day = at.toISOString().slice(0, 10);
  const started = periods.filter((p) => p.from === undefined || p.from <= day);
  return started[started.length - 1] ?? periods[0]!;
};
