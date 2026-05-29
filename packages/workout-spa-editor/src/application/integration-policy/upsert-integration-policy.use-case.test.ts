/**
 * Tests for upsertIntegrationPolicy use case.
 * Uses in-memory port mocks — no Dexie dependency.
 */
import { describe, expect, it } from "vitest";

import type { IntegrationPolicy } from "../../types/integration-policy";
import type { IntegrationPolicyRepository } from "./integration-policy-repository.port";
import { upsertIntegrationPolicy } from "./upsert-integration-policy.use-case";

const PROFILE_ID = "11111111-1111-4111-8111-111111111111";

const baseInput = {
  profileId: PROFILE_ID,
  dataType: "weight" as const,
  bridgeId: "garmin-bridge",
  direction: "import" as const,
  mode: "manual" as const,
  enabled: true,
};

const makeRepo = (): IntegrationPolicyRepository & {
  store: Map<string, IntegrationPolicy>;
} => {
  const store = new Map<string, IntegrationPolicy>();
  return {
    store,
    findByProfileDirection: async ({ profileId, dataType, direction }) =>
      [...store.values()].filter(
        (r) =>
          r.profileId === profileId &&
          r.dataType === dataType &&
          r.direction === direction
      ),
    findByNaturalKey: async ({ profileId, dataType, direction, bridgeId }) =>
      [...store.values()].find(
        (r) =>
          r.profileId === profileId &&
          r.dataType === dataType &&
          r.direction === direction &&
          r.bridgeId === bridgeId
      ),
    put: async (policy) => {
      store.set(policy.id, policy);
    },
    deleteById: async (id) => {
      store.delete(id);
    },
  };
};

describe("upsertIntegrationPolicy", () => {
  it("should insert a new row when no matching policy exists", async () => {
    // Arrange
    const repo = makeRepo();
    const deps = { policyRepo: repo };

    // Act
    const result = await upsertIntegrationPolicy(deps, baseInput);

    // Assert
    expect(repo.store.size).toBe(1);
    expect(result.id).toBeTruthy();
    expect(result.profileId).toBe(PROFILE_ID);
  });

  it("should update mode and enabled when a row with the same natural key exists", async () => {
    // Arrange
    const repo = makeRepo();
    const deps = { policyRepo: repo };
    const first = await upsertIntegrationPolicy(deps, baseInput);

    // Act
    const result = await upsertIntegrationPolicy(deps, {
      ...baseInput,
      mode: "auto",
      enabled: false,
    });

    // Assert
    expect(repo.store.size).toBe(1);
    expect(result.id).toBe(first.id);
    expect(result.mode).toBe("auto");
    expect(result.enabled).toBe(false);
  });

  it("should produce the same single row when called twice with identical input", async () => {
    // Arrange
    const repo = makeRepo();
    const deps = { policyRepo: repo };

    // Act
    const first = await upsertIntegrationPolicy(deps, baseInput);
    const second = await upsertIntegrationPolicy(deps, baseInput);

    // Assert
    expect(repo.store.size).toBe(1);
    expect(first.id).toBe(second.id);
  });

  it("should create separate rows for different bridgeIds on the same profile+dataType+direction", async () => {
    // Arrange
    const repo = makeRepo();
    const deps = { policyRepo: repo };

    // Act
    await upsertIntegrationPolicy(deps, {
      ...baseInput,
      bridgeId: "garmin-bridge",
    });
    await upsertIntegrationPolicy(deps, {
      ...baseInput,
      bridgeId: "withings-bridge",
    });

    // Assert
    expect(repo.store.size).toBe(2);
  });

  it("should reject an invalid dataType", async () => {
    // Arrange
    const repo = makeRepo();
    const deps = { policyRepo: repo };

    // Act
    let error: unknown;
    try {
      await upsertIntegrationPolicy(deps, {
        ...baseInput,
        dataType: "invalid-type" as never,
      });
    } catch (e) {
      error = e;
    }

    // Assert
    expect(error).toBeDefined();
  });
});
