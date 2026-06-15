/**
 * setModelBinding — upsert the provider+model a purpose uses for a profile.
 * Validates that the referenced provider exists and stamps `updatedAt` (ISO)
 * so the cross-device snapshot merge clock applies.
 */
import type { PersistencePort } from "../../ports/persistence-port";
import type {
  AiModelBinding,
  AiModelPurpose,
} from "../../types/ai-model-binding";
import { ProviderNotFoundError } from "./errors";

export type SetModelBindingInput = {
  profileId: string;
  purpose: AiModelPurpose;
  providerId: string;
  modelId: string;
};

export const setModelBinding = async (
  persistence: PersistencePort,
  input: SetModelBindingInput
): Promise<AiModelBinding> => {
  const provider = await persistence.aiProviders.getById(input.providerId);
  if (!provider) throw new ProviderNotFoundError(input.providerId);
  const binding: AiModelBinding = {
    ...input,
    updatedAt: new Date().toISOString(),
  };
  await persistence.aiModelBindings.put(binding);
  return binding;
};
