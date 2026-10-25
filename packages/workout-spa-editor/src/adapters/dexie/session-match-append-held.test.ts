/**
 * `appendExecutedWorkoutIds` never gives a recording to a second match
 * (design §3.7, AC-8): the append transaction skips any id another match of
 * the profile already holds, whatever week that match is dated in.
 */
import "fake-indexeddb/auto";

import { describe, expect, it } from "vitest";

import type { SessionMatchRepository } from "../../ports/session-match-repository";
import { createInMemorySessionMatchRepository } from "../../test-utils/in-memory-session-match-repository";
import { sharedKaiordDatabase } from "../../test-utils/shared-kaiord-database";
import type { SessionMatch } from "../../types/session-match";
import { createDexieSessionMatchRepository } from "./dexie-session-match-repository";

const makeMatch = (overrides: Partial<SessionMatch> = {}): SessionMatch => ({
  id: "M2",
  profileId: "p1",
  coachingActivityId: "p1:train2go:2",
  workoutId: "w2",
  date: "2026-10-15",
  createdAt: "2026-10-01T12:00:00.000Z",
  source: "auto-coaching",
  executedWorkoutIds: [],
  ...overrides,
});

// A manual match on Tuesday of week 1 holding recording R, dated Thursday
// of week 2 where M2 sits.
const holder = makeMatch({
  id: "M",
  coachingActivityId: "p1:train2go:1",
  workoutId: "w1",
  date: "2026-10-06",
  source: "manual",
  executedWorkoutIds: ["R"],
});

const db = sharedKaiordDatabase("match-append-held");

const adapters: Array<[string, () => SessionMatchRepository]> = [
  ["dexie", () => createDexieSessionMatchRepository(db)],
  ["in-memory", () => createInMemorySessionMatchRepository()],
];

describe.each(adapters)("appendExecutedWorkoutIds (%s)", (_, make) => {
  it("should skip a recording another week's match already holds", async () => {
    // Arrange
    const repo = make();
    await repo.put(holder);
    await repo.put(makeMatch());

    // Act
    await repo.appendExecutedWorkoutIds("M2", ["R", "S"]);

    // Assert
    expect((await repo.getById("M2"))?.executedWorkoutIds).toEqual(["S"]);
    expect((await repo.getById("M"))?.executedWorkoutIds).toEqual(["R"]);
  });

  it("should skip a workout another match plans", async () => {
    // Arrange
    const repo = make();
    await repo.put(holder);
    await repo.put(makeMatch());

    // Act
    await repo.appendExecutedWorkoutIds("M2", ["w1"]);

    // Assert
    expect((await repo.getById("M2"))?.executedWorkoutIds).toEqual([]);
  });

  it("should still append an id held only by another profile", async () => {
    // Arrange
    const repo = make();
    await repo.put({ ...holder, profileId: "p2" });
    await repo.put(makeMatch());

    // Act
    await repo.appendExecutedWorkoutIds("M2", ["R"]);

    // Assert
    expect((await repo.getById("M2"))?.executedWorkoutIds).toEqual(["R"]);
  });
});
