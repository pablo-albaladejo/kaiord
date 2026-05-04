import { describe, expect, it } from "vitest";

import { createInMemorySessionMatchRepository } from "../test-utils/in-memory-session-match-repository";
import type { SessionMatch } from "../types/session-match";
import { CrossProfileMatchError } from "../types/session-match-errors";
import { unmatchSession } from "./unmatch-session";

const makeMatch = (overrides: Partial<SessionMatch> = {}): SessionMatch => ({
  id: "M1",
  profileId: "p1",
  coachingActivityId: "p1:train2go:12345",
  workoutId: "w-abc",
  date: "2026-04-29",
  createdAt: "2026-05-01T12:00:00.000Z",
  source: "manual",
  ...overrides,
});

describe("unmatchSession", () => {
  it("should delete the row identified by matchId", async () => {
    // Arrange
    const repo = createInMemorySessionMatchRepository();
    await repo.put(makeMatch({ id: "M1" }));

    // Act
    await unmatchSession(
      { profileId: "p1", matchId: "M1" },
      { repository: repo }
    );

    // Assert
    expect(
      await repo.getByActivityId("p1", "p1:train2go:12345")
    ).toBeUndefined();
  });

  it("should be idempotent on missing matchId", async () => {
    // Arrange

    // Act
    const repo = createInMemorySessionMatchRepository();

    // Assert
    await expect(
      unmatchSession(
        { profileId: "p1", matchId: "never" },
        { repository: repo }
      )
    ).resolves.toBeUndefined();
  });

  it("should throw CrossProfileMatchError when match belongs to a different profile", async () => {
    // Arrange
    const repo = createInMemorySessionMatchRepository();

    // Act
    await repo.put(makeMatch({ id: "M1", profileId: "p1" }));

    // Assert
    await expect(
      unmatchSession({ profileId: "p2", matchId: "M1" }, { repository: repo })
    ).rejects.toBeInstanceOf(CrossProfileMatchError);
    expect((await repo.getByActivityId("p1", "p1:train2go:12345"))?.id).toBe(
      "M1"
    );
  });
});
