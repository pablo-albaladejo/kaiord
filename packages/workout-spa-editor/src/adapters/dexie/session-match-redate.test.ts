import "fake-indexeddb/auto";

import { describe, expect, it } from "vitest";

import type { SessionMatchRepository } from "../../ports/session-match-repository";
import { createInMemorySessionMatchRepository } from "../../test-utils/in-memory-session-match-repository";
import { sharedKaiordDatabase } from "../../test-utils/shared-kaiord-database";
import type { SessionMatch } from "../../types/session-match";
import { createDexieSessionMatchRepository } from "./dexie-session-match-repository";

const T = "2026-10-21T09:00:00.000Z";

const makeMatch = (overrides: Partial<SessionMatch> = {}): SessionMatch => ({
  id: "M1",
  profileId: "p1",
  coachingActivityId: "p1:train2go:1",
  workoutId: "w1",
  date: "2026-10-20",
  createdAt: "2026-10-01T12:00:00.000Z",
  source: "auto-coaching",
  executedWorkoutIds: [],
  ...overrides,
});

const db = sharedKaiordDatabase("match-redate");

const adapters: Array<[string, () => SessionMatchRepository]> = [
  ["dexie", () => createDexieSessionMatchRepository(db)],
  ["in-memory", () => createInMemorySessionMatchRepository()],
];

describe.each(adapters)("SessionMatchRepository re-date (%s)", (_, make) => {
  it("should re-date in place, stamp updatedAt and keep links and executed ids", async () => {
    // Arrange
    const repo = make();
    const match = makeMatch({ executedWorkoutIds: ["x1", "x2"] });
    await repo.put(match);

    // Act
    await repo.updateDate("M1", "2026-10-22", T);

    // Assert
    expect(await repo.getById("M1")).toEqual({
      ...match,
      date: "2026-10-22",
      updatedAt: T,
    });
    expect(
      await repo.listByProfileAndWeek("p1", "2026-10-22", "2026-10-22")
    ).toHaveLength(1);
  });

  it("should resolve and write nothing when the row is missing", async () => {
    // Arrange
    const repo = make();

    // Act
    await repo.updateDate("missing", "2026-10-22", T);

    // Assert
    expect(await repo.getById("missing")).toBeUndefined();
  });

  it("should reject a malformed date and leave the row unchanged", async () => {
    // Arrange
    const repo = make();
    const match = makeMatch();
    await repo.put(match);

    // Act
    const write = repo.updateDate("M1", "22/10/2026", T);

    // Assert
    await expect(write).rejects.toThrow();
    expect(await repo.getById("M1")).toEqual(match);
  });

  it("should list the matches of the given activities whatever their date", async () => {
    // Arrange
    const repo = make();
    await repo.put(makeMatch({ id: "A", date: "2026-10-26" }));
    await repo.put(
      makeMatch({
        id: "B",
        coachingActivityId: "p1:train2go:2",
        workoutId: "w2",
      })
    );
    await repo.put(
      makeMatch({
        id: "C",
        coachingActivityId: "p1:train2go:3",
        workoutId: "w3",
      })
    );
    await repo.put(
      makeMatch({
        id: "D",
        profileId: "p2",
        coachingActivityId: "p1:train2go:1",
      })
    );

    // Act
    const found = await repo.listByActivityIds("p1", [
      "p1:train2go:1",
      "p1:train2go:2",
    ]);

    // Assert
    expect(found.map((m) => m.id).sort()).toEqual(["A", "B"]);
  });

  it("should return nothing for an empty activity list", async () => {
    // Arrange
    const repo = make();
    await repo.put(makeMatch());

    // Act
    const found = await repo.listByActivityIds("p1", []);

    // Assert
    expect(found).toEqual([]);
  });

  it("should list every match of the profile and no other", async () => {
    // Arrange
    const repo = make();
    await repo.put(makeMatch({ id: "A" }));
    await repo.put(
      makeMatch({
        id: "B",
        coachingActivityId: "p1:train2go:2",
        workoutId: "w2",
        date: "2027-01-01",
      })
    );
    await repo.put(makeMatch({ id: "C", profileId: "p2" }));

    // Act
    const found = await repo.listByProfile("p1");

    // Assert
    expect(found.map((m) => m.id).sort()).toEqual(["A", "B"]);
  });
});
