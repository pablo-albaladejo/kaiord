import { describe, expect, it } from "vitest";

import { createInMemoryAutoMatchDismissalRepository } from "../test-utils/in-memory-auto-match-dismissal-repository";
import { DISMISSAL_TTL_MS } from "./auto-match-dismissal-ttl";
import {
  dismissAutoMatchBanner,
  isAutoMatchBannerDismissed,
} from "./auto-match-dismissal";

const fixedClock = () => "2026-05-01T12:00:00.000Z";

describe("DISMISSAL_TTL_MS", () => {
  it("is 24 hours expressed in milliseconds", () => {
    expect(DISMISSAL_TTL_MS).toBe(24 * 60 * 60 * 1000);
  });
});

describe("dismissAutoMatchBanner", () => {
  it("upserts a row keyed by (profileId, weekStart) with dismissedAt from injected clock", async () => {
    const repo = createInMemoryAutoMatchDismissalRepository();

    await dismissAutoMatchBanner(
      { profileId: "p1", weekStart: "2026-04-27" },
      { repository: repo, clock: fixedClock }
    );

    expect(await repo.getByProfileAndWeek("p1", "2026-04-27")).toEqual({
      profileId: "p1",
      weekStart: "2026-04-27",
      dismissedAt: "2026-05-01T12:00:00.000Z",
    });
  });

  it("is idempotent — second dismiss refreshes dismissedAt", async () => {
    const repo = createInMemoryAutoMatchDismissalRepository();

    await dismissAutoMatchBanner(
      { profileId: "p1", weekStart: "2026-04-27" },
      { repository: repo, clock: () => "2026-05-01T10:00:00.000Z" }
    );
    await dismissAutoMatchBanner(
      { profileId: "p1", weekStart: "2026-04-27" },
      { repository: repo, clock: () => "2026-05-01T15:00:00.000Z" }
    );

    expect(
      (await repo.getByProfileAndWeek("p1", "2026-04-27"))?.dismissedAt
    ).toBe("2026-05-01T15:00:00.000Z");
  });
});

describe("isAutoMatchBannerDismissed", () => {
  it("returns false when no row exists for (profileId, weekStart)", async () => {
    const repo = createInMemoryAutoMatchDismissalRepository();

    const result = await isAutoMatchBannerDismissed(
      {
        profileId: "p1",
        weekStart: "2026-04-27",
        now: new Date("2026-05-01T12:00:00Z"),
      },
      { repository: repo }
    );

    expect(result).toBe(false);
  });

  it("returns true when dismissedAt is within the TTL window", async () => {
    const repo = createInMemoryAutoMatchDismissalRepository();
    await repo.put({
      profileId: "p1",
      weekStart: "2026-04-27",
      dismissedAt: "2026-05-01T10:00:00.000Z",
    });

    const result = await isAutoMatchBannerDismissed(
      {
        profileId: "p1",
        weekStart: "2026-04-27",
        now: new Date("2026-05-01T12:00:00Z"), // 2h later
      },
      { repository: repo }
    );

    expect(result).toBe(true);
  });

  it("returns false when dismissedAt is older than the TTL window", async () => {
    const repo = createInMemoryAutoMatchDismissalRepository();
    await repo.put({
      profileId: "p1",
      weekStart: "2026-04-27",
      dismissedAt: "2026-05-01T10:00:00.000Z",
    });

    const result = await isAutoMatchBannerDismissed(
      {
        profileId: "p1",
        weekStart: "2026-04-27",
        now: new Date("2026-05-02T11:00:00Z"), // 25h later
      },
      { repository: repo }
    );

    expect(result).toBe(false);
  });

  it("returns true at the boundary when now === dismissedAt", async () => {
    const repo = createInMemoryAutoMatchDismissalRepository();
    await repo.put({
      profileId: "p1",
      weekStart: "2026-04-27",
      dismissedAt: "2026-05-01T12:00:00.000Z",
    });

    const result = await isAutoMatchBannerDismissed(
      {
        profileId: "p1",
        weekStart: "2026-04-27",
        now: new Date("2026-05-01T12:00:00Z"),
      },
      { repository: repo }
    );

    expect(result).toBe(true);
  });
});
