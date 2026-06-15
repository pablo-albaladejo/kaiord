/**
 * Per-profile AI model binding: the provider + model a given AI purpose uses.
 *
 * Decoupled from the credential record so the API key and the model are chosen
 * independently. `default` is the fallback for any purpose without an override.
 */

export type AiModelPurpose = "default" | "chat" | "workout_generation";

export type AiModelBinding = {
  profileId: string;
  purpose: AiModelPurpose;
  providerId: string;
  modelId: string;
  // ISO-8601 last-write stamp. The snapshot merge clock (`recordClock`) reads
  // it to resolve cross-device conflicts on the `[profileId+purpose]` key.
  updatedAt: string;
};
