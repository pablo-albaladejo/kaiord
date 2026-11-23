import type { LlmProviderType } from "../../store/ai-store-types";
import { DESTINATIONS } from "../data-flows/destinations";

/** The Provider's proper name, the same in every language. */
export const providerName = (type: LlmProviderType): string =>
  DESTINATIONS[type].name;

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
  const name = wanted.trim() || providerName(type);
  if (!taken.includes(name)) return name;
  let n = 2;
  while (taken.includes(`${name} ${n}`)) n += 1;
  return `${name} ${n}`;
};
