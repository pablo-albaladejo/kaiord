/**
 * Tests for the Dexie DataTypeSourcePolicyRepository adapter — real
 * fake-indexeddb-backed KaiordDatabase, verifying the v30
 * `dataTypeSourcePolicy` store round-trips through the natural
 * [profileId+dataType] key.
 */
import "fake-indexeddb/auto";

import { beforeEach, describe, expect, it } from "vitest";

import { sharedKaiordDatabase } from "../../test-utils/shared-kaiord-database";
import { createDexieDataTypeSourcePolicyRepository } from "./dexie-data-type-source-policy-repository";

const PROFILE_ID = "11111111-1111-4111-8111-111111111111";

describe("createDexieDataTypeSourcePolicyRepository", () => {
  const db = sharedKaiordDatabase("source-policy");

  beforeEach(async () => {
    await db.open();
  });

  it("should return undefined when no companion row exists for the type", async () => {
    // Arrange
    const repo = createDexieDataTypeSourcePolicyRepository(db);

    // Act
    const result = await repo.findByProfileAndType({
      profileId: PROFILE_ID,
      dataType: "sleep",
    });

    // Assert
    expect(result).toBeUndefined();
  });

  it("should round-trip a priority policy through put and findByProfileAndType", async () => {
    // Arrange
    const repo = createDexieDataTypeSourcePolicyRepository(db);
    const policy = {
      profileId: PROFILE_ID,
      dataType: "sleep" as const,
      mode: "priority" as const,
      sourceOrder: ["whoop-bridge", "garmin-bridge"],
    };

    // Act
    await repo.put(policy);
    const result = await repo.findByProfileAndType({
      profileId: PROFILE_ID,
      dataType: "sleep",
    });

    // Assert
    expect(result).toEqual(policy);
  });

  it("should overwrite the existing row on a second put for the same [profileId+dataType]", async () => {
    // Arrange
    const repo = createDexieDataTypeSourcePolicyRepository(db);
    await repo.put({
      profileId: PROFILE_ID,
      dataType: "sleep",
      mode: "priority",
      sourceOrder: ["whoop-bridge"],
    });

    // Act
    await repo.put({
      profileId: PROFILE_ID,
      dataType: "sleep",
      mode: "union",
      sourceOrder: [],
    });
    const result = await repo.findByProfileAndType({
      profileId: PROFILE_ID,
      dataType: "sleep",
    });
    const count = await db.table("dataTypeSourcePolicy").count();

    // Assert
    expect(result?.mode).toBe("union");
    expect(count).toBe(1);
  });

  it("should keep policies for different data types independent", async () => {
    // Arrange
    const repo = createDexieDataTypeSourcePolicyRepository(db);
    await repo.put({
      profileId: PROFILE_ID,
      dataType: "sleep",
      mode: "priority",
      sourceOrder: ["whoop-bridge"],
    });
    await repo.put({
      profileId: PROFILE_ID,
      dataType: "hrv",
      mode: "priority",
      sourceOrder: ["garmin-bridge"],
    });

    // Act
    const sleep = await repo.findByProfileAndType({
      profileId: PROFILE_ID,
      dataType: "sleep",
    });
    const hrv = await repo.findByProfileAndType({
      profileId: PROFILE_ID,
      dataType: "hrv",
    });

    // Assert
    expect(sleep?.sourceOrder).toEqual(["whoop-bridge"]);
    expect(hrv?.sourceOrder).toEqual(["garmin-bridge"]);
  });
});
