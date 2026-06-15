/**
 * AiModelBindingRepository port — per-profile model bindings.
 *
 * Keyed by `[profileId+purpose]` so each purpose has at most one binding per
 * profile. Profile-scoped: cascade-deleted on profile removal and carried in
 * the cloud-sync snapshot.
 */

import type { AiModelBinding, AiModelPurpose } from "../types/ai-model-binding";

export type AiModelBindingRepository = {
  /** All bindings for a profile (default plus any overrides). */
  getAll: (profileId: string) => Promise<AiModelBinding[]>;
  /** One binding by purpose, or `undefined` when unset. */
  get: (
    profileId: string,
    purpose: AiModelPurpose
  ) => Promise<AiModelBinding | undefined>;
  /** Upsert a binding (one row per `[profileId+purpose]`). */
  put: (binding: AiModelBinding) => Promise<void>;
  /** Remove one binding. No-op when absent. */
  delete: (profileId: string, purpose: AiModelPurpose) => Promise<void>;
  /** Bulk-delete every binding for a profile (profile-delete cascade). */
  deleteByProfile: (profileId: string) => Promise<void>;
};
