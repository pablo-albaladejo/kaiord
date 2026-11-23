/**
 * A workout the assistant would create from a description written after it
 * read health data, refused because the generation Provider must not get
 * health data. The description is the model's own free text: Kaiord cannot
 * prove it holds no health value, so it never goes without the athlete's
 * yes for that Provider. The error carries the Provider out of band (never
 * as text), and the model reads only the fixed answer below.
 */
import type { LlmProviderType } from "@kaiord/ai/providers";

import { providerName } from "../ai/provider-label";

const WITHHELD = new WeakMap<object, LlmProviderType>();

export const healthWithheldError = (to: LlmProviderType): Error => {
  const error = new Error("health_withheld");
  WITHHELD.set(error, to);
  return error;
};

/** The Provider a refused description was for, or undefined. */
export const healthWithheldTo = (
  error: unknown
): LlmProviderType | undefined =>
  typeof error === "object" && error !== null ? WITHHELD.get(error) : undefined;

/** What the model is told, app-authored: the Provider name is a fixed one. */
export const healthWithheldAnswer = (to: LlmProviderType) => ({
  error: "health_withheld",
  reason:
    `The athlete chose not to send health data to ${providerName(to)}, ` +
    "and this conversation has read their health data, so the workout was " +
    "not created. Tell the athlete; do not try again in this conversation.",
});
