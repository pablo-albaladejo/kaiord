/**
 * Approximate blended USD rate per 1M tokens for each LLM provider
 * family. Used only by the batch cost-estimation dialog — the value
 * is shown to the user as an estimate, never as billing truth (the
 * dialog carries an explicit "estimate" disclaimer).
 *
 * Rates blend input + output costs against a roughly balanced mix for
 * the cheapest model in each family's mainline. Update when providers
 * change prices (source: each provider's public pricing page).
 *
 * Last reviewed: 2026-04-18.
 */

import type { LlmProviderType } from "../store/ai-store-types";

const PROVIDER_RATES_USD_PER_MILLION: Record<LlmProviderType, number> = {
  anthropic: 3.0,
  openai: 1.5,
  google: 0.3,
};

export function getProviderRate(type: LlmProviderType): number {
  return PROVIDER_RATES_USD_PER_MILLION[type];
}
