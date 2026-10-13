import { describe, expect, it } from "vitest";

import { createInMemoryPersistence } from "../../test-utils/in-memory-persistence";
import { profileSchema } from "../../types/profile";
import { importProfile } from "./import-profile";
import { makeProfile } from "./test-fixtures";

const FTP = 250;
const LTHR = 170;

const makeRichProfile = () => {
  const base = makeProfile({
    id: "00000000-0000-4000-8000-0000000000a1",
    name: "Rich Athlete",
    bodyWeight: 72,
    linkedAccounts: [
      {
        source: "train2go",
        externalUserId: "u-1",
        externalUserName: "Rich",
        linkedAt: "2026-01-01T00:00:00.000Z",
      },
    ],
  });
  return {
    ...base,
    origin: "auto" as const,
    maxHeartRate: 190,
    restingHeartRate: 48,
    height: 180,
    birthDate: "1985-03-02",
    sex: "male" as const,
    activityLevel: "active" as const,
    sportZones: {
      ...base.sportZones,
      cycling: {
        ...base.sportZones.cycling!,
        thresholds: { ftp: FTP, lthr: LTHR },
        powerZones: {
          method: "custom" as const,
          zones: [{ zone: 1, name: "Easy", minPercent: 0, maxPercent: 55 }],
        },
      },
      running: {
        ...base.sportZones.running!,
        thresholds: {
          lthr: 165,
          thresholdPace: 270,
          paceUnit: "min_per_km" as const,
        },
        paceZones: {
          method: "custom" as const,
          zones: [
            {
              zone: 1,
              name: "Easy",
              minPace: 330,
              maxPace: 400,
              unit: "min_per_km" as const,
            },
          ],
        },
      },
    },
  };
};

describe("importProfile", () => {
  it("should round-trip an exported profile keeping every athlete field", async () => {
    // Arrange
    const persistence = createInMemoryPersistence();
    const original = profileSchema.parse(makeRichProfile());
    const exported = JSON.parse(JSON.stringify(original));

    // Act
    const imported = await importProfile(
      persistence,
      profileSchema.parse(exported)
    );

    // Assert
    const stored = await persistence.profiles.getAll();
    expect(stored).toHaveLength(1);
    const strip = (p: typeof original) => {
      const copy: Partial<typeof original> = structuredClone(p);
      for (const key of [
        "id",
        "createdAt",
        "updatedAt",
        "linkedAccounts",
        "origin",
      ] as const) {
        delete copy[key];
      }
      return copy;
    };
    expect(strip(stored[0]!)).toEqual(strip(original));
    expect(imported.sportZones.cycling?.thresholds.ftp).toBe(FTP);
  });

  it("should assign a fresh identity and reset links and origin", async () => {
    // Arrange
    const persistence = createInMemoryPersistence();
    const original = profileSchema.parse(makeRichProfile());

    // Act
    const imported = await importProfile(persistence, original);

    // Assert
    expect(imported.id).not.toBe(original.id);
    expect(imported.linkedAccounts).toEqual([]);
    expect(imported.origin).toBeUndefined();
    expect(imported.createdAt).not.toBe(original.createdAt);
    expect(imported.updatedAt).toBe(imported.createdAt);
    expect(await persistence.profiles.getActiveId()).toBe(imported.id);
  });
});
