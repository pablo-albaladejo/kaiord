import type { LlmProviderType } from "../../store/ai-store-types";

export const PROVIDER_TYPE_NAMES: Record<LlmProviderType, string> = {
  anthropic: "Anthropic",
  openai: "OpenAI",
  google: "Google",
};

/**
 * The label an account gets when the athlete leaves it blank: the provider's
 * name, numbered from 2 when an account already carries it.
 */
export const defaultProviderLabel = (
  type: LlmProviderType,
  taken: ReadonlyArray<string>
): string => {
  const name = PROVIDER_TYPE_NAMES[type];
  if (!taken.includes(name)) return name;
  let n = 2;
  while (taken.includes(`${name} ${n}`)) n += 1;
  return `${name} ${n}`;
};
