/**
 * Tests for deleteIntegrationPolicy use case.
 * Uses in-memory port mocks — no Dexie dependency.
 */
import { describe, expect, it } from "vitest";

import type { IntegrationPolicy } from "../../types/integration-policy";
import { deleteIntegrationPolicy } from "./delete-integration-policy.use-case";
import type { IntegrationPolicyRepository } from "./integration-policy-repository.port";

const PROFILE_ID = "11111111-1111-4111-8111-111111111111";

const makeRepo = (): IntegrationPolicyRepository & {
  store: Map<string, IntegrationPolicy>;
} => {
  const store = new Map<string, IntegrationPolicy>();
  return {
    store,
    findByProfileDirection: async () => [],
    findByNaturalKey: async () => undefined,
    put: async (p) => {
      store.set(p.id, p);
    },
    deleteById: async (id) => {
      store.delete(id);
    },
  };
};

describe("deleteIntegrationPolicy", () => {
  it("should delete the policy row by id", async () => {
    // Arrange
    const repo = makeRepo();
    const policyId = crypto.randomUUID();
    repo.store.set(policyId, {
      id: policyId,
      profileId: PROFILE_ID,
      dataType: "weight",
      bridgeId: "garmin-bridge",
      direction: "import",
      mode: "manual",
      enabled: true,
      updatedAt: "2026-05-26T00:00:00.000Z",
    });
    const deps = { policyRepo: repo };

    // Act
    await deleteIntegrationPolicy(deps, { id: policyId });

    // Assert
    expect(repo.store.size).toBe(0);
  });

  it("should be a no-op when the id does not exist", async () => {
    // Arrange
    const repo = makeRepo();
    const deps = { policyRepo: repo };

    // Act
    let error: unknown;
    try {
      await deleteIntegrationPolicy(deps, { id: crypto.randomUUID() });
    } catch (e) {
      error = e;
    }

    // Assert
    expect(error).toBeUndefined();
    expect(repo.store.size).toBe(0);
  });
});
