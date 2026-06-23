import "fake-indexeddb/auto";

import { beforeEach, describe, expect, it } from "vitest";

import {
  buildCoachingDayNotesId,
  type CoachingDayNotesRecord,
} from "../../types/coaching-day-notes-record";
import { createDexieCoachingDayNotesRepository } from "./dexie-coaching-day-notes-repository";
import { KaiordDatabase } from "./dexie-database";

const makeRecord = (
  overrides: Partial<CoachingDayNotesRecord> = {}
): CoachingDayNotesRecord => {
  const profileId = overrides.profileId ?? "p1";
  const source = overrides.source ?? "train2go";
  const date = overrides.date ?? "2026-06-07";
  return {
    id: buildCoachingDayNotesId(profileId, source, date),
    profileId,
    source,
    date,
    comments: [
      {
        author: "Coach",
        isOwn: false,
        timestamp: "2026-06-07 22:55:38",
        text: "Great race!",
      },
    ],
    fetchedAt: "2026-06-12T10:00:00.000Z",
    ...overrides,
  };
};

describe("DexieCoachingDayNotesRepository", () => {
  let db: KaiordDatabase;
  beforeEach(() => {
    db = new KaiordDatabase(
      `kaiord-daynotes-test-${Date.now()}-${Math.random()}`
    );
  });

  it("should fetch a stored thread by profile, source and date", async () => {
    // Arrange
    const repo = createDexieCoachingDayNotesRepository(db);
    await repo.upsert(makeRecord());

    // Act
    const result = await repo.getByDate("p1", "train2go", "2026-06-07");

    // Assert
    expect(result?.comments).toHaveLength(1);
    expect(result?.comments[0]?.text).toBe("Great race!");
  });

  it("should replace the thread wholesale on re-upsert (no comment merge)", async () => {
    // Arrange
    const repo = createDexieCoachingDayNotesRepository(db);
    await repo.upsert(makeRecord());

    // Act
    await repo.upsert(
      makeRecord({
        comments: [
          {
            author: "A",
            isOwn: true,
            timestamp: "t1",
            text: "one",
          },
          {
            author: "B",
            isOwn: false,
            timestamp: "t2",
            text: "two",
          },
        ],
      })
    );
    const result = await repo.getByDate("p1", "train2go", "2026-06-07");

    // Assert
    expect(result?.comments).toHaveLength(2);
    expect(result?.comments.map((c) => c.text)).toEqual(["one", "two"]);
  });

  it("should return undefined for a date with no stored thread", async () => {
    // Arrange
    const repo = createDexieCoachingDayNotesRepository(db);

    // Act
    const result = await repo.getByDate("p1", "train2go", "2026-06-09");

    // Assert
    expect(result).toBeUndefined();
  });

  it("should delete only the given profile's rows on deleteByProfile", async () => {
    // Arrange
    const repo = createDexieCoachingDayNotesRepository(db);
    await repo.upsert(makeRecord({ profileId: "p1" }));
    await repo.upsert(makeRecord({ profileId: "p2" }));

    // Act
    await repo.deleteByProfile("p1");

    // Assert
    expect(
      await repo.getByDate("p1", "train2go", "2026-06-07")
    ).toBeUndefined();
    expect(await repo.getByDate("p2", "train2go", "2026-06-07")).toBeDefined();
  });
});
