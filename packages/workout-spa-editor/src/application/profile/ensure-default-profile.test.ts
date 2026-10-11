import { describe, expect, it } from "vitest";

import { createInMemoryPersistence } from "../../test-utils/in-memory-persistence";
import { ensureDefaultProfile } from "./ensure-default-profile";
import { makeProfile, seedProfile } from "./test-fixtures";
import { updateProfile } from "./update-profile";
import { updateSportThresholds } from "./zones/update-sport-thresholds";

describe("ensureDefaultProfile", () => {
  it("should create one auto profile and select it when none exists", async () => {
    // Arrange
    const persistence = createInMemoryPersistence();

    // Act
    const profile = await ensureDefaultProfile(persistence, "Mi perfil");

    // Assert
    expect(profile).toMatchObject({ name: "Mi perfil", origin: "auto" });
    expect(await persistence.profiles.getAll()).toHaveLength(1);
    expect(await persistence.profiles.getActiveId()).toBe(profile?.id);
  });

  it("should be idempotent across repeated calls", async () => {
    // Arrange
    const persistence = createInMemoryPersistence();
    await ensureDefaultProfile(persistence, "Mi perfil");

    // Act
    const second = await ensureDefaultProfile(persistence, "Mi perfil");

    // Assert
    expect(second).toBeNull();
    expect(await persistence.profiles.getAll()).toHaveLength(1);
  });

  it("should do nothing when a profile already exists", async () => {
    // Arrange
    const persistence = createInMemoryPersistence();
    await seedProfile(persistence, makeProfile());

    // Act
    const created = await ensureDefaultProfile(persistence, "Mi perfil");

    // Assert
    expect(created).toBeNull();
    expect(await persistence.profiles.getAll()).toEqual([makeProfile()]);
  });

  it("should fail open when persistence rejects", async () => {
    // Arrange
    const persistence = createInMemoryPersistence();
    const broken = {
      ...persistence,
      transaction: async () => {
        throw new Error("quota");
      },
    };

    // Act
    const created = await ensureDefaultProfile(broken, "Mi perfil");

    // Assert
    expect(created).toBeNull();
  });
});

describe("auto profile claim triggers", () => {
  it("should claim the auto profile when the user edits its fields", async () => {
    // Arrange
    const persistence = createInMemoryPersistence();
    const auto = await ensureDefaultProfile(persistence, "Mi perfil");

    // Act
    const updated = await updateProfile(persistence, auto?.id ?? "", {
      bodyWeight: 70,
    });

    // Assert
    expect(updated.origin).toBe("local");
  });

  it("should claim the auto profile when the user sets thresholds", async () => {
    // Arrange
    const persistence = createInMemoryPersistence();
    const auto = await ensureDefaultProfile(persistence, "Mi perfil");

    // Act
    const updated = await updateSportThresholds(
      persistence,
      auto?.id ?? "",
      "cycling",
      { ftp: 250 }
    );

    // Assert
    expect(updated.origin).toBe("local");
  });

  it("should leave a real profile's origin untouched on edit", async () => {
    // Arrange
    const persistence = createInMemoryPersistence();
    await seedProfile(persistence, makeProfile());

    // Act
    const updated = await updateProfile(persistence, makeProfile().id, {
      name: "Renamed",
    });

    // Assert
    expect(updated.origin).toBeUndefined();
  });
});
