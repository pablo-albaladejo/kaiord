import { describe, expect, it } from "vitest";

import { applyBackupTablePolicy } from "./backup-table-policy";

describe("applyBackupTablePolicy", () => {
  it("should keep the rows of an included table unchanged", () => {
    // Arrange
    const workout = { id: "w-1", profileId: "p-1", updatedAt: "2026-10-10" };

    // Act
    const tables = applyBackupTablePolicy({ workouts: [workout] });

    // Assert
    expect(tables.workouts).toEqual([workout]);
  });

  it("should drop the integration cursors and the device-local tables", () => {
    // Arrange
    const input = {
      syncState: [{ source: "garmin" }],
      coachingSyncState: [{ source: "train2go", profileId: "p-1" }],
      connections: [{ profileId: "p-1", providerId: "whoop" }],
      tombstones: [{ table: "workouts", id: "w-0" }],
      bridges: [{ id: "b-1" }],
    };

    // Act
    const tables = applyBackupTablePolicy(input);

    // Assert
    expect(tables).toEqual({});
  });

  it("should drop the nutrition tables, which travel through their repositories", () => {
    // Arrange
    const input = {
      intakeEntries: [{ id: "i-1" }],
      intakePresets: [{ id: "ip-1" }],
      energyTargets: [{ profileId: "p-1" }],
    };

    // Act
    const tables = applyBackupTablePolicy(input);

    // Assert
    expect(tables).toEqual({});
  });

  it("should drop a table the policy does not classify", () => {
    // Arrange
    const input = { someFutureTable: [{ id: "x-1", secret: "s" }] };

    // Act
    const tables = applyBackupTablePolicy(input);

    // Assert
    expect(tables).toEqual({});
  });

  it("should remove the apiKey field from AI providers and keep the rest", () => {
    // Arrange
    const provider = {
      id: "ai-1",
      type: "anthropic",
      label: "Mine",
      apiKey: "ciphertext",
      isDefault: true,
    };

    // Act
    const tables = applyBackupTablePolicy({ aiProviders: [provider] });

    // Assert
    expect(tables.aiProviders).toEqual([
      { id: "ai-1", type: "anthropic", label: "Mine", isDefault: true },
    ]);
    expect(tables.aiProviders?.[0]).not.toHaveProperty("apiKey");
  });

  it("should write an unclaimed default profile as a real one", () => {
    // Arrange
    const auto = { id: "p-auto", name: "Mi perfil", origin: "auto" };
    const real = { id: "p-real", name: "Ana" };

    // Act
    const tables = applyBackupTablePolicy({ profiles: [auto, real] });

    // Assert
    expect(tables.profiles).toEqual([{ ...auto, origin: "local" }, real]);
  });

  it("should not mutate the rows it is given", () => {
    // Arrange
    const auto = { id: "p-auto", origin: "auto" };
    const provider = { id: "ai-1", apiKey: "ciphertext" };

    // Act
    applyBackupTablePolicy({ profiles: [auto], aiProviders: [provider] });

    // Assert
    expect(auto.origin).toBe("auto");
    expect(provider.apiKey).toBe("ciphertext");
  });
});
