import { listedModels } from "@kaiord/ai/providers";

import type { LlmProviderConfig } from "../../../store/ai-store-types";

/** A provider and one of its models, always chosen together. */
export type ModelChoice = { providerId: string; modelId: string };

export const INHERIT_VALUE = "__inherit__";
const SEP = "::";
const CUSTOM = "__custom__";

export const encodeChoice = ({ providerId, modelId }: ModelChoice): string =>
  `${providerId}${SEP}${modelId}`;

export const encodeCustom = (providerId: string): string =>
  encodeChoice({ providerId, modelId: CUSTOM });

/** The choice an option value names, or the provider whose "Other…" it is. */
export const decodeChoice = (
  value: string
): { choice: ModelChoice } | { customFor: string } | null => {
  const at = value.indexOf(SEP);
  if (at < 0) return null;
  const providerId = value.slice(0, at);
  const modelId = value.slice(at + SEP.length);
  if (modelId === CUSTOM) return { customFor: providerId };
  return modelId ? { choice: { providerId, modelId } } : null;
};

export type ModelChoiceGroup = {
  provider: LlmProviderConfig;
  models: string[];
};

/**
 * One group per account with its catalog models, pinned snapshots of a
 * listed alias left out. A model that runs but is
 * not in the catalog (a custom id, a stored legacy model) is listed first in
 * its group, so the select can show what actually runs.
 */
export const modelChoiceGroups = (
  providers: LlmProviderConfig[],
  running: ModelChoice | null
): ModelChoiceGroup[] =>
  providers.map((provider) => {
    const models = listedModels(provider.type);
    const extra =
      running?.providerId === provider.id && !models.includes(running.modelId)
        ? [running.modelId]
        : [];
    return { provider, models: [...extra, ...models] };
  });
