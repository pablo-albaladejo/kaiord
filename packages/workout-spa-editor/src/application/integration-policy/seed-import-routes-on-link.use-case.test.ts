/**
 * Tests for seedImportRoutesOnLink. In-memory port — no Dexie dependency.
 */
import { describe, expect, it } from "vitest";

import type { IntegrationPolicy } from "../../types/integration-policy";
import type { IntegrationPolicyRepository } from "./integration-policy-repository.port";
import { seedImportRoutesOnLink } from "./seed-import-routes-on-link.use-case";

const PROFILE_ID = "11111111-1111-4111-8111-111111111111";
const T2G_CAPS = ["read:training-plan", "read:training-zones"];
const GARMIN_CAPS = ["write:workouts", "read:activities", "write:body"];

const makeRepo = (seed: IntegrationPolicy[] = []) => {
  const store = new Map(seed.map((p) => [p.id, p]));
  const repo: IntegrationPolicyRepository = {
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
    getById: async (id) => store.get(id),
    put: async (policy) => {
      store.set(policy.id, policy);
    },
    deleteById: async (id) => {
      store.delete(id);
    },
  };
  return { repo, store };
};

describe("seedImportRoutesOnLink", () => {
  it("should open every import route a freshly linked Train2Go feeds", async () => {
    // Arrange
    const { repo, store } = makeRepo();

    // Act
    const seeded = await seedImportRoutesOnLink(
      { policyRepo: repo },
      {
        profileId: PROFILE_ID,
        bridgeId: "train2go-bridge",
        capabilities: T2G_CAPS,
      }
    );

    // Assert
    expect(seeded.sort()).toEqual(["planned-session", "training-zones"]);
    const rows = [...store.values()];
    expect(rows.every((r) => r.enabled && r.mode === "auto")).toBe(true);
    expect(rows.every((r) => r.direction === "import")).toBe(true);
  });

  it("should seed only Garmin's import routes, never its export", async () => {
    // Arrange
    const { repo, store } = makeRepo();

    // Act
    await seedImportRoutesOnLink(
      { policyRepo: repo },
      {
        profileId: PROFILE_ID,
        bridgeId: "garmin-bridge",
        capabilities: GARMIN_CAPS,
      }
    );

    // Assert
    const rows = [...store.values()];
    expect(rows.map((r) => r.dataType)).toEqual(["activity"]);
  });

  it("should leave a route the user switched off disabled", async () => {
    // Arrange
    const off: IntegrationPolicy = {
      id: "off",
      profileId: PROFILE_ID,
      dataType: "planned-session",
      direction: "import",
      bridgeId: "train2go-bridge",
      mode: "manual",
      enabled: false,
      updatedAt: "2026-01-01T00:00:00.000Z",
    };
    const { repo, store } = makeRepo([off]);

    // Act
    const seeded = await seedImportRoutesOnLink(
      { policyRepo: repo },
      {
        profileId: PROFILE_ID,
        bridgeId: "train2go-bridge",
        capabilities: T2G_CAPS,
      }
    );

    // Assert
    expect(seeded).toEqual(["training-zones"]);
    expect(store.get("off")).toEqual(off);
  });

  it("should seed nothing when the bridge announced no capabilities", async () => {
    // Arrange
    const { repo, store } = makeRepo();

    // Act
    const seeded = await seedImportRoutesOnLink(
      { policyRepo: repo },
      { profileId: PROFILE_ID, bridgeId: "train2go-bridge", capabilities: [] }
    );

    // Assert
    expect(seeded).toEqual([]);
    expect(store.size).toBe(0);
  });
});
