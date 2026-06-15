/**
 * v21 → v22 migration — additive `aiModelBindings` table plus a one-time
 * backfill of each profile's `default` binding from the current default
 * provider (or the first provider) and its model. Existing users keep the
 * same model immediately after the key↔model decoupling.
 *
 * Only `apiKey` is encrypted on provider rows, so `model`/`id`/`isDefault`
 * are read directly here. Idempotent via Dexie's once-per-bump version gate
 * and the `[profileId+purpose]` primary key.
 */
import type { Transaction } from "dexie";

import type { AiModelBinding } from "../../types/ai-model-binding";

type RawProvider = { id: string; model?: string; isDefault?: boolean };
type RawProfile = { id: string };

export const applyV22Upgrade = async (tx: Transaction): Promise<void> => {
  const providers = (await tx.table("aiProviders").toArray()) as RawProvider[];
  const seed = providers.find((p) => p.isDefault) ?? providers[0];
  if (!seed || typeof seed.model !== "string" || seed.model.length === 0)
    return;
  const profiles = (await tx.table("profiles").toArray()) as RawProfile[];
  if (profiles.length === 0) return;
  const updatedAt = new Date().toISOString();
  const rows: AiModelBinding[] = profiles.map((profile) => ({
    profileId: profile.id,
    purpose: "default",
    providerId: seed.id,
    modelId: seed.model as string,
    updatedAt,
  }));
  await tx.table("aiModelBindings").bulkPut(rows);
};
