/**
 * Dexie ConnectionRepository contract tests. Runs against fake-indexeddb so no
 * real IndexedDB is required; exercises the v24 `connections` store.
 */
import "fake-indexeddb/auto";

import { afterEach, beforeEach, describe, expect, it } from "vitest";

import type { ConnectionRecord } from "../../types/connection";
import { createDexieConnectionRepository } from "./dexie-connection-repository";
import { KaiordDatabase } from "./dexie-database";

const dbName = () => `kaiord-test-connections-${Date.now()}-${Math.random()}`;

const record = (
  profileId: string,
  providerId: string,
  overrides: Partial<ConnectionRecord> = {}
): ConnectionRecord => ({
  profileId,
  providerId,
  status: "connected",
  mechanism: "api-key",
  updatedAt: "2026-06-19T00:00:00.000Z",
  ...overrides,
});

describe("createDexieConnectionRepository", () => {
  let db: KaiordDatabase;
  let repo: ReturnType<typeof createDexieConnectionRepository>;

  beforeEach(async () => {
    db = new KaiordDatabase(dbName());
    await db.open();
    repo = createDexieConnectionRepository(db);
  });

  afterEach(async () => {
    db.close();
    await db.delete();
  });

  it("should round-trip a connection record by its composite key", async () => {
    // Arrange
    const row = record("p1", "intervals", { credentialRef: "cipher" });

    // Act
    await repo.put(row);
    const found = await repo.get("p1", "intervals");

    // Assert
    expect(found).toEqual(row);
  });

  it("should return only the requested profile's connections", async () => {
    // Arrange
    await repo.put(record("p1", "intervals"));
    await repo.put(record("p1", "garmin", { mechanism: "bridge" }));
    await repo.put(record("p2", "intervals"));

    // Act
    const forP1 = await repo.getByProfile("p1");

    // Assert
    expect(forP1.map((r) => r.providerId).sort()).toEqual([
      "garmin",
      "intervals",
    ]);
  });

  it("should delete a single connection by composite key", async () => {
    // Arrange
    await repo.put(record("p1", "intervals"));

    // Act
    await repo.delete("p1", "intervals");

    // Assert
    expect(await repo.get("p1", "intervals")).toBeUndefined();
  });

  it("should delete every connection for a profile on cascade", async () => {
    // Arrange
    await repo.put(record("p1", "intervals"));
    await repo.put(record("p1", "garmin", { mechanism: "bridge" }));
    await repo.put(record("p2", "intervals"));

    // Act
    await repo.deleteByProfile("p1");

    // Assert
    expect(await repo.getByProfile("p1")).toEqual([]);
    expect(await repo.getByProfile("p2")).toHaveLength(1);
  });
});
