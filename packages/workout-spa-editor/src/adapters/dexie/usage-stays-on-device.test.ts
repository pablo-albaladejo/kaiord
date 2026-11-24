/**
 * The usage log stays on this device, like the Traces: not in the Drive
 * sync snapshot, not in a backup file, and neither an old snapshot nor an
 * old file that still carries `usageEvents` writes one here or keeps them
 * in Drive. Nothing synced or backed up names a Trace.
 */
import "fake-indexeddb/auto";

import { describe, expect, it } from "vitest";

import { exportBackup } from "../../application/backup/export-backup";
import { importBackup } from "../../application/backup/import-backup";
import { syncWithCloud } from "../../application/sync/sync-with-cloud";
import { createInMemoryCloudSyncPort } from "../../test-utils/in-memory-cloud-sync-port";
import { sharedKaiordDatabase } from "../../test-utils/shared-kaiord-database";
import { buildTrace } from "../../test-utils/trace-fixture";
import {
  BACKUP_FORMAT,
  BACKUP_VERSION,
  EMPTY_NUTRITION_STUB,
} from "../../types/backup";
import type { Snapshot } from "../../types/snapshot";
import { createDexieSnapshotPort } from "./dexie-snapshot-port";

const usageRow = (id: string) => ({
  id,
  yearMonth: "2026-11",
  date: "2026-11-23",
  purpose: "chat",
  providerType: "anthropic",
  modelId: "claude-sonnet-5",
  promptTokens: 100,
  completionTokens: 20,
  tokens: 120,
  cost: 0.0004,
  costBasis: "price_table",
  priceReadOn: "2026-11-23",
  requestCount: 1,
  failedRequests: 0,
  unmeasuredRequests: 0,
  createdAt: "2026-11-23T10:00:00.000Z",
});

// What a device on an earlier build pushed: per-run rows naming their Trace.
const oldRemote = (): Snapshot => ({
  manifest: {
    schemaVersion: 38,
    deviceId: "old-device",
    exportedAt: "2026-11-22T00:00:00.000Z",
    encrypted: false,
  },
  tables: {
    usageEvents: [{ ...usageRow("remote-usage"), traceId: "remote-trace" }],
  },
  tombstones: [{ table: "usageEvents", id: "pruned-usage", deletedAt: 1 }],
});

describe("the usage log stays on the device", () => {
  const db = sharedKaiordDatabase("usage-on-device");

  const seeded = async () => {
    await db.open();
    await db.table("usageEvents").add(usageRow("local-usage"));
    await db.table("traces").add(buildTrace({ id: "local-trace" }));
    return createDexieSnapshotPort(db);
  };

  it("should push no usage row, no Trace and no Trace id to Drive", async () => {
    // Arrange
    const snapshotPort = await seeded();
    const cloud = createInMemoryCloudSyncPort({
      authenticated: true,
      snapshot: oldRemote(),
      revision: "rev-0",
      pushCount: 0,
    });

    // Act
    await syncWithCloud({ cloud, snapshotPort, deviceId: "dev-1" });
    const pushed = cloud.state.snapshot!;
    const usageIds = (await db.table("usageEvents").toArray()).map((r) => r.id);
    db.close();

    // Assert
    expect(pushed.tables).not.toHaveProperty("usageEvents");
    expect(pushed.tables).not.toHaveProperty("traces");
    expect(pushed.tombstones.map((t) => t.table)).not.toContain("usageEvents");
    expect(JSON.stringify(pushed)).not.toContain("traceId");
    expect(JSON.stringify(pushed)).not.toMatch(/local-usage|remote-usage/);
    expect(usageIds).toEqual(["local-usage"]);
  });

  it("should leave the usage log and the Traces out of a backup file", async () => {
    // Arrange
    const port = await seeded();

    // Act
    const backup = await exportBackup({ port, deviceId: "dev-1" });
    db.close();

    // Assert
    expect(backup.tables).not.toHaveProperty("usageEvents");
    expect(backup.tables).not.toHaveProperty("traces");
    expect(JSON.stringify(backup)).not.toContain("traceId");
    expect(JSON.stringify(backup)).not.toContain("local-usage");
  });

  it("should ignore the usage rows an old backup file carries", async () => {
    // Arrange
    const port = await seeded();
    const old = oldRemote();
    const backup = {
      format: BACKUP_FORMAT,
      version: BACKUP_VERSION,
      manifest: old.manifest,
      tables: old.tables,
      tombstones: old.tombstones,
      nutrition: EMPTY_NUTRITION_STUB,
    };

    // Act
    await importBackup({ port, deviceId: "dev-1", backup });
    const rows = await db.table("usageEvents").toArray();
    db.close();

    // Assert
    expect(rows.map((r) => r.id)).toEqual(["local-usage"]);
    expect(rows[0]).not.toHaveProperty("traceId");
  });
});
