/**
 * Coverage guard for the backup file: every table of the live Dexie schema
 * must carry a backup rule. A new store fails here until someone decides
 * whether its rows belong in a file the user downloads.
 */
import "fake-indexeddb/auto";

import { beforeEach, describe, expect, it } from "vitest";

import { BACKUP_TABLE_POLICY } from "../../application/backup/backup-table-policy";
import { sharedKaiordDatabase } from "../../test-utils/shared-kaiord-database";
import { DEVICE_LOCAL } from "./dexie-snapshot-port";

describe("backup table policy coverage", () => {
  const db = sharedKaiordDatabase("backupcover");

  beforeEach(async () => {
    await db.open();
  });

  it("should classify every table of the live schema", () => {
    // Arrange
    const classified = new Set(Object.keys(BACKUP_TABLE_POLICY));

    // Act
    const unclassified = db.tables
      .map((t) => t.name)
      .filter((table) => !classified.has(table))
      .sort();

    // Assert
    expect(unclassified).toEqual([]);
  });

  it("should not classify a table that does not exist", () => {
    // Arrange
    const tableNames = new Set(db.tables.map((t) => t.name));

    // Act
    const phantom = Object.keys(BACKUP_TABLE_POLICY)
      .filter((table) => !tableNames.has(table))
      .sort();

    // Assert
    expect(phantom).toEqual([]);
  });

  it("should not rely on the snapshot for a device-local table", () => {
    // Arrange
    // the snapshot port never exports these, so a snapshot-based rule
    // (include or a row rewrite) would silently ship an empty table.
    const viaSnapshot = (table: string) => {
      const rule = BACKUP_TABLE_POLICY[table];
      return rule === "include" || typeof rule === "function";
    };

    // Act
    const misrouted = [...DEVICE_LOCAL].filter(viaSnapshot).sort();

    // Assert
    expect(misrouted).toEqual([]);
  });
});
