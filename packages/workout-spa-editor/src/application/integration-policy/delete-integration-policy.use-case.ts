/**
 * deleteIntegrationPolicy — deletes an IntegrationPolicy row by id.
 * No-op when the row is already absent.
 *
 * `integrationPolicies` rides the cloud snapshot, and the `withTombstones`
 * decorator cannot reach this repo (its delete is `deleteById`, not a
 * single-arg `delete(id)`), so the removed Data Hub route records its own
 * `[integrationPolicies+id]` tombstone here — the precedent `deleteConversation`
 * sets. Without it the route reappears at the next merge, on the deleting
 * device included. The read-then-delete-then-mark runs in one transaction so a
 * failed delete leaves no tombstone, mirroring the decorator's guarantee.
 */
import type { DeleteIntegrationPolicyDeps } from "./delete-integration-policy-deps";

export type DeleteIntegrationPolicyInput = {
  id: string;
};

export const deleteIntegrationPolicy = async (
  deps: DeleteIntegrationPolicyDeps,
  input: DeleteIntegrationPolicyInput,
  now: () => Date = () => new Date()
): Promise<void> => {
  await deps.transaction(async () => {
    // Never tombstone a no-op delete: it would suppress a row another device
    // still legitimately holds (same guard the decorator applies).
    const existing = await deps.policyRepo.getById(input.id);
    if (!existing) return;
    await deps.policyRepo.deleteById(input.id);
    await deps.tombstones.put({
      table: "integrationPolicies",
      id: input.id,
      deletedAt: now().toISOString(),
      profileId: existing.profileId,
    });
  });
};
