/**
 * clearModelBinding — remove a profile's binding for one purpose, reverting
 * that purpose to the resolver fallback chain.
 */
import type { PersistencePort } from "../../ports/persistence-port";
import type { AiModelPurpose } from "../../types/ai-model-binding";

export const clearModelBinding = async (
  persistence: PersistencePort,
  profileId: string,
  purpose: AiModelPurpose
): Promise<void> => {
  await persistence.aiModelBindings.delete(profileId, purpose);
};
