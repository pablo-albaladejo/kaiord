import { describe, expect, it } from "vitest";

import { db } from "../../../adapters/dexie/dexie-database";
import { createDexiePersistence } from "../../../adapters/dexie/dexie-persistence-adapter";
import { createInMemoryPersistence } from "../../../test-utils/in-memory-persistence";
import { makeProfile, seedProfile } from "../test-fixtures";
import { updateSportThresholds } from "./update-sport-thresholds";

const FTP = 250;
const THRESHOLD_PACE = 270;

describe("updateSportThresholds on a sport with no config", () => {
  // The Athlete page edits thresholds inline for every sport, including one an
  // older or imported profile never configured; the write must not vanish.
  it("should create the sport's config and store the threshold", async () => {
    // Arrange
    const persistence = createInMemoryPersistence();
    const profile = makeProfile();
    delete profile.sportZones.running;
    await seedProfile(persistence, profile);

    // Act
    const updated = await updateSportThresholds(
      persistence,
      profile.id,
      "running",
      { ftp: FTP, thresholdPace: THRESHOLD_PACE, paceUnit: "min_per_km" }
    );

    // Assert
    const stored = await persistence.profiles.getById(profile.id);
    expect(updated.sportZones.running?.thresholds).toEqual({
      ftp: FTP,
      thresholdPace: THRESHOLD_PACE,
      paceUnit: "min_per_km",
    });
    expect(stored?.sportZones.running?.heartRateZones).toBeDefined();
    expect(stored?.sportZones.running?.paceZones).toBeDefined();
  });
});

describe("updateSportThresholds with a patch", () => {
  // Two fields committed back to back must both land: the patch is merged
  // into what is stored at write time, not into what the page last read.
  // Dexie, because the in-memory adapter does not serialize transactions.
  it("should merge each patch into the stored thresholds", async () => {
    // Arrange
    await db.table("profiles").clear();
    const persistence = createDexiePersistence(db);
    const profile = makeProfile();
    await seedProfile(persistence, profile);
    const LTHR = 170;

    // Act
    await Promise.all([
      updateSportThresholds(persistence, profile.id, "cycling", (current) => ({
        ...current,
        ftp: FTP,
      })),
      updateSportThresholds(persistence, profile.id, "cycling", (current) => ({
        ...current,
        lthr: LTHR,
      })),
    ]);

    // Assert
    const stored = await persistence.profiles.getById(profile.id);
    expect(stored?.sportZones.cycling?.thresholds).toEqual({
      ftp: FTP,
      lthr: LTHR,
    });
  });
});
