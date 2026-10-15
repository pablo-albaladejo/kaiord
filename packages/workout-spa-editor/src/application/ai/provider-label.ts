import type { LlmProviderType } from "../../store/ai-store-types";

export const PROVIDER_TYPE_NAMES: Record<LlmProviderType, string> = {
  anthropic: "Anthropic",
  openai: "OpenAI",
  google: "Google",
};

/**
 * An account's label, never one another account already carries: a repeat is
 * numbered from 2 ("Anthropic 2", "Work 2"). A blank label becomes the
 * provider's name, numbered the same way.
 */
export const uniqueProviderLabel = (
  wanted: string,
  type: LlmProviderType,
  taken: ReadonlyArray<string>
): string => {
  const name = wanted.trim() || PROVIDER_TYPE_NAMES[type];
  if (!taken.includes(name)) return name;
  let n = 2;
  while (taken.includes(`${name} ${n}`)) n += 1;
  return `${name} ${n}`;
};
