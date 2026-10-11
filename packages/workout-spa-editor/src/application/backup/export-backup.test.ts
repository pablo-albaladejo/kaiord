import { describe, expect, it } from "vitest";

import { createInMemorySnapshotPort } from "../../test-utils/in-memory-snapshot-port";
import { exportBackup } from "./export-backup";

const NOW = new Date("2026-10-11T09:00:00.000Z");

const autoProfile = { id: "p-auto", name: "Mi perfil", origin: "auto" };
const realProfile = { id: "p-real", name: "Ana" };

const intake = (id: string, profileId: string, date: string) => ({
  id,
  profileId,
  date,
  loggedAt: "2026-10-10T08:00:00.000Z",
  updatedAt: "2026-10-10T08:00:00.000Z",
  kcal: 500,
  proteinG: 30,
  carbG: 50,
  fatG: 15,
});

const setup = () => {
  const tables: Record<string, unknown[]> = {
    profiles: [autoProfile, realProfile],
    workouts: [{ id: "w-1", profileId: "p-auto", updatedAt: "2026-10-10" }],
    aiProviders: [{ id: "ai-1", type: "anthropic", apiKey: "ciphertext" }],
    syncState: [{ source: "garmin", cursor: "c-1" }],
    meta: [{ key: "activeProfileId", value: "p-auto" }],
  };
  const port = createInMemorySnapshotPort({
    schemaVersion: 40,
    tables,
    tombstones: [
      { table: "workouts", id: "w-0", deletedAt: "2026-10-01T00:00:00.000Z" },
    ],
  });
  return { tables, port };
};

const run = (deps: ReturnType<typeof setup>) =>
  exportBackup({
    port: deps.port,
    deviceId: "dev-1",
    now: () => NOW,
  });

describe("exportBackup", () => {
  it("should declare the kaiord-backup format, version and manifest", async () => {
    // Arrange
    const deps = setup();

    // Act
    const backup = await run(deps);

    // Assert
    expect(backup.format).toBe("kaiord-backup");
    expect(backup.version).toBe(2);
    expect(backup.manifest).toEqual({
      schemaVersion: 40,
      deviceId: "dev-1",
      exportedAt: NOW.toISOString(),
      encrypted: false,
    });
  });

  it("should carry the user's records and tombstones through the table policy", async () => {
    // Arrange
    const deps = setup();

    // Act
    const backup = await run(deps);

    // Assert
    expect(backup.tables.workouts).toEqual(deps.tables.workouts);
    expect(backup.tables.meta).toEqual(deps.tables.meta);
    expect(backup.tables).not.toHaveProperty("syncState");
    expect(backup.tombstones).toEqual([
      { table: "workouts", id: "w-0", deletedAt: "2026-10-01T00:00:00.000Z" },
    ]);
  });

  it("should never serialize an API key, a sync cursor or an unclaimed profile", async () => {
    // Arrange
    const deps = setup();

    // Act
    const json = JSON.stringify(await run(deps));

    // Assert
    expect(json).not.toContain("apiKey");
    expect(json).not.toContain("syncState");
    expect(json).not.toContain('"origin":"auto"');
  });

  it("should leave the local default profile unclaimed", async () => {
    // Arrange
    const deps = setup();

    // Act
    const backup = await run(deps);

    // Assert
    expect(backup.tables.profiles).toContainEqual({
      ...autoProfile,
      origin: "local",
    });
    expect(autoProfile.origin).toBe("auto");
    const local = await deps.port.exportTables();
    expect(local.profiles).toContainEqual(autoProfile);
  });

  it("should carry every profile's nutrition in its tables", async () => {
    // Arrange
    const deps = setup();
    const preset = {
      id: "ip-1",
      profileId: "p-real",
      label: "Oats",
      kcal: 300,
      proteinG: 10,
      carbG: 50,
      fatG: 5,
      createdAt: "2026-10-01T00:00:00.000Z",
      updatedAt: "2026-10-01T00:00:00.000Z",
    };
    const target = {
      profileId: "p-auto",
      goalType: "fat_loss" as const,
      startWeightKg: 80,
      targetWeightKg: 75,
      targetDate: "2026-12-01",
      createdAt: "2026-10-01T00:00:00.000Z",
      updatedAt: "2026-10-01T00:00:00.000Z",
    };
    deps.tables.intakeEntries = [
      intake("i-1", "p-auto", "2026-10-10"),
      intake("i-2", "p-real", "2026-10-09"),
    ];
    deps.tables.intakePresets = [preset];
    deps.tables.energyTargets = [target];

    // Act
    const backup = await run(deps);

    // Assert
    expect(backup.tables.intakeEntries).toEqual(deps.tables.intakeEntries);
    expect(backup.tables.intakePresets).toEqual([preset]);
    expect(backup.tables.energyTargets).toEqual([target]);
    expect(backup).not.toHaveProperty("nutrition");
  });
});
