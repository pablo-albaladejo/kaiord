/**
 * The Traces never leave this device: not in the Drive sync snapshot, not in
 * a backup file, and neither a snapshot nor a file can write one here.
 */
import "fake-indexeddb/auto";

import { describe, expect, it } from "vitest";

import { applyBackupTablePolicy } from "../../application/backup/backup-table-policy";
import { exportBackup } from "../../application/backup/export-backup";
import { exportSnapshot } from "../../application/sync/export-snapshot";
import { importSnapshot } from "../../application/sync/import-snapshot";
import { sharedKaiordDatabase } from "../../test-utils/shared-kaiord-database";
import { buildTrace } from "../../test-utils/trace-fixture";
import { createDexieSnapshotPort } from "./dexie-snapshot-port";

describe("the Traces stay on the device", () => {
  const db = sharedKaiordDatabase("traces-on-device");

  it("should leave the Traces out of the sync snapshot", async () => {
    // Arrange
    await db.open();
    await db.table("traces").add(buildTrace());
    const port = createDexieSnapshotPort(db);

    // Act
    const snapshot = await exportSnapshot({ port, deviceId: "dev-1" });
    db.close();

    // Assert
    expect(snapshot.tables).not.toHaveProperty("traces");
    expect(JSON.stringify(snapshot)).not.toContain("trace-1");
  });

  it("should keep this device's Traces when a remote snapshot is imported", async () => {
    // Arrange
    await db.open();
    await db.table("traces").add(buildTrace());
    const port = createDexieSnapshotPort(db);
    const remote = await exportSnapshot({ port, deviceId: "dev-2" });
    remote.tables.traces = [buildTrace({ id: "remote-trace" })];

    // Act
    await importSnapshot({ port, snapshot: remote });
    const ids = (await db.table("traces").toArray()).map((t) => t.id);
    db.close();

    // Assert
    expect(ids).toEqual(["trace-1"]);
  });

  it("should leave the Traces out of a backup file", async () => {
    // Arrange
    await db.open();
    await db.table("traces").add(buildTrace());
    const port = createDexieSnapshotPort(db);

    // Act
    const backup = await exportBackup({ port, deviceId: "dev-1" });
    db.close();

    // Assert
    expect(backup.tables).not.toHaveProperty("traces");
    expect(JSON.stringify(backup)).not.toContain("trace-1");
  });

  it("should drop Traces a tampered backup file carries", () => {
    // Arrange
    const tables = { traces: [buildTrace()], workouts: [] };

    // Act
    const kept = applyBackupTablePolicy(tables);

    // Assert
    expect(kept).not.toHaveProperty("traces");
  });
});
