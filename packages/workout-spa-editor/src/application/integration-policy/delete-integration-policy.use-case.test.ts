/**
 * Tests for deleteIntegrationPolicy use case.
 * Uses the in-memory persistence port — no Dexie dependency.
 */
import { describe, expect, it } from "vitest";

import { createInMemoryPersistence } from "../../test-utils/in-memory-persistence";
import type { IntegrationPolicy } from "../../types/integration-policy";
import { deleteIntegrationPolicy } from "./delete-integration-policy.use-case";
import type { DeleteIntegrationPolicyDeps } from "./delete-integration-policy-deps";

const PROFILE_ID = "11111111-1111-4111-8111-111111111111";

const policy = (id: string): IntegrationPolicy => ({
  id,
  profileId: PROFILE_ID,
  dataType: "weight",
  bridgeId: "garmin-bridge",
  direction: "import",
  mode: "manual",
  enabled: true,
  updatedAt: "2026-05-26T00:00:00.000Z",
});

const makeDeps = (): DeleteIntegrationPolicyDeps & {
  port: ReturnType<typeof createInMemoryPersistence>;
} => {
  const port = createInMemoryPersistence();
  return {
    port,
    policyRepo: port.integrationPolicy,
    tombstones: port.tombstones,
    transaction: port.transaction,
  };
};

describe("deleteIntegrationPolicy", () => {
  it("should delete the policy row by id", async () => {
    // Arrange
    const deps = makeDeps();
    const policyId = crypto.randomUUID();
    await deps.policyRepo.put(policy(policyId));

    // Act
    await deleteIntegrationPolicy(deps, { id: policyId });

    // Assert
    expect(await deps.policyRepo.getById(policyId)).toBeUndefined();
  });

  it("should record a tombstone so the removed route does not resurrect on merge", async () => {
    // Arrange
    const deps = makeDeps();
    const policyId = crypto.randomUUID();
    await deps.policyRepo.put(policy(policyId));

    // Act
    await deleteIntegrationPolicy(deps, { id: policyId });

    // Assert
    expect(
      await deps.tombstones.get("integrationPolicies", policyId)
    ).toMatchObject({ table: "integrationPolicies", profileId: PROFILE_ID });
  });

  it("should be a no-op when the id does not exist", async () => {
    // Arrange
    const deps = makeDeps();
    const missingId = crypto.randomUUID();

    // Act
    let error: unknown;
    try {
      await deleteIntegrationPolicy(deps, { id: missingId });
    } catch (e) {
      error = e;
    }

    // Assert
    expect(error).toBeUndefined();
    expect(await deps.tombstones.list()).toEqual([]);
  });
});
