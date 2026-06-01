import { describe, expect, it } from "vitest";

import { createInMemorySnapshotPort } from "../../test-utils/in-memory-snapshot-port";
import { exportSnapshot } from "./export-snapshot";

const SCHEMA_VERSION = 19;

const state = () => ({
  schemaVersion: SCHEMA_VERSION,
  tables: {
    workouts: [{ id: "w-1", updatedAt: "2026-05-20T00:00:00Z" }],
    templates: [{ id: "t-1" }],
    profiles: [{ id: "p-1" }],
    aiProviders: [{ id: "ai-1" }],
    usage: [{ yearMonth: "2026-05" }],
  },
  tombstones: [
    { table: "workouts", id: "gone", deletedAt: "2026-05-19T00:00:00Z" },
  ],
});

describe("exportSnapshot", () => {
  it("should include every table's rows under tables", async () => {
    // Arrange
    const port = createInMemorySnapshotPort(state());

    // Act
    const snapshot = await exportSnapshot({ port, deviceId: "dev-1" });

    // Assert
    expect(Object.keys(snapshot.tables).sort()).toEqual([
      "aiProviders",
      "profiles",
      "templates",
      "usage",
      "workouts",
    ]);
    expect(snapshot.tables.workouts).toHaveLength(1);
  });

  it("should set the manifest schemaVersion to the port value", async () => {
    // Arrange
    const port = createInMemorySnapshotPort(state());

    // Act
    const snapshot = await exportSnapshot({ port, deviceId: "dev-1" });

    // Assert
    expect(snapshot.manifest.schemaVersion).toBe(SCHEMA_VERSION);
  });

  it("should record deviceId, an ISO exportedAt, and encrypted=false", async () => {
    // Arrange
    const port = createInMemorySnapshotPort(state());
    const fixed = new Date("2026-05-31T12:00:00.000Z");

    // Act
    const snapshot = await exportSnapshot({
      port,
      deviceId: "dev-1",
      now: () => fixed,
    });

    // Assert
    expect(snapshot.manifest.deviceId).toBe("dev-1");
    expect(snapshot.manifest.exportedAt).toBe("2026-05-31T12:00:00.000Z");
    expect(snapshot.manifest.encrypted).toBe(false);
  });

  it("should carry the tombstone list through to the snapshot", async () => {
    // Arrange
    const port = createInMemorySnapshotPort(state());

    // Act
    const snapshot = await exportSnapshot({ port, deviceId: "dev-1" });

    // Assert
    expect(snapshot.tombstones).toEqual([
      { table: "workouts", id: "gone", deletedAt: "2026-05-19T00:00:00Z" },
    ]);
  });
});
