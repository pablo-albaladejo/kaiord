/**
 * Unit tests for backfillSyncZonesPolicies.
 */
import "fake-indexeddb/auto";

import Dexie from "dexie";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { backfillSyncZonesPolicies } from "./dexie-v17-syncZones-backfill";

const dbName = (suffix: string) =>
  `kaiord-test-v17-sz-${suffix}-${Date.now()}-${Math.random()}`;

const STORES = {
  profiles: "id",
  integrationPolicies:
    "id, [profileId+dataType+direction], &[profileId+dataType+direction+bridgeId], profileId",
} as const;

const PROFILE_ID = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";

describe("backfillSyncZonesPolicies", () => {
  let name: string;
  let db: Dexie;

  beforeEach(() => {
    name = dbName("apply");
    db = new Dexie(name);
    db.version(1).stores(STORES);
  });

  afterEach(async () => {
    db.close();
    await Dexie.delete(name);
  });

  it("should insert an IntegrationPolicy for a profile with syncZones=true", async () => {
    // Arrange
    await db.open();
    await db.table("profiles").add({
      id: PROFILE_ID,
      linkedAccounts: [{ source: "train2go", syncZones: true }],
    });

    // Act
    let result!: { inserted: number; skipped: number };
    await db.transaction(
      "rw",
      ["profiles", "integrationPolicies"],
      async (tx) => {
        result = await backfillSyncZonesPolicies(tx);
      }
    );

    // Assert
    const policies = await db.table("integrationPolicies").toArray();
    expect(policies).toHaveLength(1);
    expect(policies[0]).toMatchObject({
      profileId: PROFILE_ID,
      dataType: "training-zones",
      direction: "import",
      bridgeId: "train2go-bridge",
      mode: "auto",
      enabled: true,
    });
    expect(result.inserted).toBe(1);
    expect(result.skipped).toBe(0);
  });

  it("should skip profiles without syncZones=true", async () => {
    // Arrange
    await db.open();
    await db.table("profiles").add({
      id: PROFILE_ID,
      linkedAccounts: [{ source: "train2go", syncZones: false }],
    });

    // Act
    let result!: { inserted: number; skipped: number };
    await db.transaction(
      "rw",
      ["profiles", "integrationPolicies"],
      async (tx) => {
        result = await backfillSyncZonesPolicies(tx);
      }
    );

    // Assert
    expect(await db.table("integrationPolicies").toArray()).toHaveLength(0);
    expect(result.inserted).toBe(0);
  });

  it("should not duplicate IntegrationPolicy rows on re-run", async () => {
    // Arrange
    await db.open();
    await db.table("profiles").add({
      id: PROFILE_ID,
      linkedAccounts: [{ source: "train2go", syncZones: true }],
    });
    await db.transaction(
      "rw",
      ["profiles", "integrationPolicies"],
      async (tx) => {
        await backfillSyncZonesPolicies(tx);
      }
    );

    // Act
    let result!: { inserted: number; skipped: number };
    await db.transaction(
      "rw",
      ["profiles", "integrationPolicies"],
      async (tx) => {
        result = await backfillSyncZonesPolicies(tx);
      }
    );

    // Assert
    expect(await db.table("integrationPolicies").toArray()).toHaveLength(1);
    expect(result.inserted).toBe(0);
    expect(result.skipped).toBe(1);
  });

  it("should handle profiles with no linkedAccounts gracefully", async () => {
    // Arrange
    await db.open();
    await db.table("profiles").add({ id: PROFILE_ID });

    // Act
    let result!: { inserted: number; skipped: number };
    await db.transaction(
      "rw",
      ["profiles", "integrationPolicies"],
      async (tx) => {
        result = await backfillSyncZonesPolicies(tx);
      }
    );

    // Assert
    expect(await db.table("integrationPolicies").toArray()).toHaveLength(0);
    expect(result.inserted).toBe(0);
  });
});
