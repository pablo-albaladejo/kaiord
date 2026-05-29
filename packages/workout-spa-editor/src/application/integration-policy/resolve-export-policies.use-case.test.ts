/**
 * Tests for resolveExportPolicies use case.
 * Uses in-memory port mocks — no Dexie dependency.
 */
import { describe, expect, it } from "vitest";

import type { IntegrationPolicy } from "../../types/integration-policy";
import type { IntegrationPolicyRepository } from "./integration-policy-repository.port";
import { resolveExportPolicies } from "./resolve-export-policies.use-case";

const PROFILE_ID = "11111111-1111-4111-8111-111111111111";

const makePolicy = (
  overrides: Partial<IntegrationPolicy> = {}
): IntegrationPolicy => ({
  id: crypto.randomUUID(),
  profileId: PROFILE_ID,
  dataType: "workout",
  bridgeId: "garmin-bridge",
  direction: "export",
  mode: "manual",
  enabled: true,
  updatedAt: "2026-05-26T00:00:00.000Z",
  ...overrides,
});

const makeRepo = (rows: IntegrationPolicy[]): IntegrationPolicyRepository => ({
  findByProfileDirection: async ({ profileId, dataType, direction }) =>
    rows.filter(
      (r) =>
        r.profileId === profileId &&
        r.dataType === dataType &&
        r.direction === direction
    ),
  findByNaturalKey: async () => undefined,
  put: async () => undefined,
  deleteById: async () => undefined,
});

describe("resolveExportPolicies", () => {
  it("should return an empty array when no export policies exist for the profile", async () => {
    // Arrange
    const deps = { policyRepo: makeRepo([]) };

    // Act
    const result = await resolveExportPolicies(deps, {
      profileId: PROFILE_ID,
      dataType: "workout",
    });

    // Assert
    expect(result).toEqual([]);
  });

  it("should return a single export policy for the profile and dataType", async () => {
    // Arrange
    const deps = { policyRepo: makeRepo([makePolicy()]) };

    // Act
    const result = await resolveExportPolicies(deps, {
      profileId: PROFILE_ID,
      dataType: "workout",
    });

    // Assert
    expect(result).toHaveLength(1);
    expect(result[0]?.bridgeId).toBe("garmin-bridge");
  });

  it("should return multiple policies ordered by bridgeId alphabetically", async () => {
    // Arrange
    const rows = [
      makePolicy({ bridgeId: "strava-bridge" }),
      makePolicy({ bridgeId: "garmin-bridge" }),
    ];
    const deps = { policyRepo: makeRepo(rows) };

    // Act
    const result = await resolveExportPolicies(deps, {
      profileId: PROFILE_ID,
      dataType: "workout",
    });

    // Assert
    expect(result).toHaveLength(2);
    expect(result[0]?.bridgeId).toBe("garmin-bridge");
    expect(result[1]?.bridgeId).toBe("strava-bridge");
  });

  it("should return disabled rows as well as enabled rows", async () => {
    // Arrange
    const rows = [
      makePolicy({ enabled: true }),
      makePolicy({ bridgeId: "strava-bridge", enabled: false }),
    ];
    const deps = { policyRepo: makeRepo(rows) };

    // Act
    const result = await resolveExportPolicies(deps, {
      profileId: PROFILE_ID,
      dataType: "workout",
    });

    // Assert
    expect(result).toHaveLength(2);
  });

  it("should exclude import-direction rows when querying export", async () => {
    // Arrange
    const deps = {
      policyRepo: makeRepo([makePolicy({ direction: "import" })]),
    };

    // Act
    const result = await resolveExportPolicies(deps, {
      profileId: PROFILE_ID,
      dataType: "workout",
    });

    // Assert
    expect(result).toEqual([]);
  });

  it("should exclude rows from other profiles", async () => {
    // Arrange
    const deps = {
      policyRepo: makeRepo([makePolicy({ profileId: "other-p" })]),
    };

    // Act
    const result = await resolveExportPolicies(deps, {
      profileId: PROFILE_ID,
      dataType: "workout",
    });

    // Assert
    expect(result).toEqual([]);
  });
});
