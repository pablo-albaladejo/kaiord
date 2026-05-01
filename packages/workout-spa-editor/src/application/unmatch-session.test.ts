import { describe, expect, it } from "vitest";

import { createInMemorySessionMatchRepository } from "../test-utils/in-memory-session-match-repository";
import { CrossProfileMatchError } from "../types/session-match-errors";
import type { SessionMatch } from "../types/session-match";
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
  it("deletes the row identified by matchId", async () => {
    const repo = createInMemorySessionMatchRepository();
    await repo.put(makeMatch({ id: "M1" }));

    await unmatchSession(
      { profileId: "p1", matchId: "M1" },
      { repository: repo }
    );

    expect(
      await repo.getByActivityId("p1", "p1:train2go:12345")
    ).toBeUndefined();
  });

  it("is idempotent on missing matchId", async () => {
    const repo = createInMemorySessionMatchRepository();

    await expect(
      unmatchSession(
        { profileId: "p1", matchId: "never" },
        { repository: repo }
      )
    ).resolves.toBeUndefined();
  });

  it("throws CrossProfileMatchError when match belongs to a different profile", async () => {
    const repo = createInMemorySessionMatchRepository();
    await repo.put(makeMatch({ id: "M1", profileId: "p1" }));

    await expect(
      unmatchSession({ profileId: "p2", matchId: "M1" }, { repository: repo })
    ).rejects.toBeInstanceOf(CrossProfileMatchError);
    expect((await repo.getByActivityId("p1", "p1:train2go:12345"))?.id).toBe(
      "M1"
    );
  });
});
