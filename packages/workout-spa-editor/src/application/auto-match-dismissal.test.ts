/**
 * Use-case tests for the per-pair dismissal model.
 *
 * Covers every scenario in `spa-session-match` "dismissAutoMatchBanner
 * use case":
 *   - first dismissal on a clean week
 *   - second dismissal on the same week appends to the row
 *   - re-dismissing the same pair updates dismissedAt in place
 *   - read returns true for a recorded pair
 *   - read returns false for an unrecorded pair (or absent row)
 *   - empty input rejected on write path; safe-default false on read
 *   - 257th distinct pair is a no-op
 *   - re-dismiss at the cap updates the existing entry
 */

import { describe, expect, it, vi } from "vitest";

import { createInMemoryAutoMatchDismissalRepository } from "../test-utils/in-memory-auto-match-dismissal-repository";
import { InvalidInputError } from "../types/invalid-input-error";
import {
  dismissAutoMatchBanner,
  isAutoMatchBannerDismissed,
} from "./auto-match-dismissal";

const NOW_1 = "2026-05-01T10:00:00.000Z";
const NOW_2 = "2026-05-01T11:00:00.000Z";

const baseInput = {
  profileId: "p1",
  weekStart: "2026-04-27",
  activityId: "a1",
  workoutId: "w1",
};

describe("dismissAutoMatchBanner — happy paths", () => {
  it("first dismissal writes a row with one entry", async () => {
    const repo = createInMemoryAutoMatchDismissalRepository();

    await dismissAutoMatchBanner(baseInput, {
      repository: repo,
      clock: () => NOW_1,
    });

    const stored = await repo.getByProfileAndWeek("p1", "2026-04-27");
    expect(stored).toEqual({
      profileId: "p1",
      weekStart: "2026-04-27",
      dismissedPairs: [
        { activityId: "a1", workoutId: "w1", dismissedAt: NOW_1 },
      ],
    });
  });

  it("second dismissal on the same week appends to the existing row", async () => {
    const repo = createInMemoryAutoMatchDismissalRepository();
    await dismissAutoMatchBanner(baseInput, {
      repository: repo,
      clock: () => NOW_1,
    });

    await dismissAutoMatchBanner(
      { ...baseInput, activityId: "a2", workoutId: "w2" },
      { repository: repo, clock: () => NOW_2 }
    );

    const stored = await repo.getByProfileAndWeek("p1", "2026-04-27");
    expect(stored?.dismissedPairs).toEqual([
      { activityId: "a1", workoutId: "w1", dismissedAt: NOW_1 },
      { activityId: "a2", workoutId: "w2", dismissedAt: NOW_2 },
    ]);
  });

  it("re-dismissing the same pair updates dismissedAt in place (no duplicate)", async () => {
    const repo = createInMemoryAutoMatchDismissalRepository();
    await dismissAutoMatchBanner(baseInput, {
      repository: repo,
      clock: () => NOW_1,
    });

    await dismissAutoMatchBanner(baseInput, {
      repository: repo,
      clock: () => NOW_2,
    });

    const stored = await repo.getByProfileAndWeek("p1", "2026-04-27");
    expect(stored?.dismissedPairs).toHaveLength(1);
    expect(stored?.dismissedPairs[0]?.dismissedAt).toBe(NOW_2);
  });
});

describe("isAutoMatchBannerDismissed", () => {
  it("returns true for a recorded pair", async () => {
    const repo = createInMemoryAutoMatchDismissalRepository();
    await dismissAutoMatchBanner(baseInput, {
      repository: repo,
      clock: () => NOW_1,
    });

    const dismissed = await isAutoMatchBannerDismissed(baseInput, {
      repository: repo,
    });

    expect(dismissed).toBe(true);
  });

  it("returns false for a different pair on the same week", async () => {
    const repo = createInMemoryAutoMatchDismissalRepository();
    await dismissAutoMatchBanner(baseInput, {
      repository: repo,
      clock: () => NOW_1,
    });

    const dismissed = await isAutoMatchBannerDismissed(
      { ...baseInput, activityId: "a-other" },
      { repository: repo }
    );

    expect(dismissed).toBe(false);
  });

  it("returns false when no row exists for the (profileId, weekStart)", async () => {
    const repo = createInMemoryAutoMatchDismissalRepository();

    const dismissed = await isAutoMatchBannerDismissed(baseInput, {
      repository: repo,
    });

    expect(dismissed).toBe(false);
  });
});

describe("dismissAutoMatchBanner — defensive guards", () => {
  it("rejects empty profileId on the write path", async () => {
    const repo = createInMemoryAutoMatchDismissalRepository();

    await expect(
      dismissAutoMatchBanner(
        { ...baseInput, profileId: "" },
        { repository: repo, clock: () => NOW_1 }
      )
    ).rejects.toThrow(InvalidInputError);
  });

  it.each([["weekStart"], ["activityId"], ["workoutId"]])(
    "rejects empty %s on the write path",
    async (field) => {
      const repo = createInMemoryAutoMatchDismissalRepository();

      await expect(
        dismissAutoMatchBanner(
          { ...baseInput, [field]: "" },
          { repository: repo, clock: () => NOW_1 }
        )
      ).rejects.toThrow(InvalidInputError);
    }
  );

  it("safe-defaults to false on the read path for an empty input", async () => {
    const repo = createInMemoryAutoMatchDismissalRepository();

    const dismissed = await isAutoMatchBannerDismissed(
      { ...baseInput, profileId: "" },
      { repository: repo }
    );

    expect(dismissed).toBe(false);
  });
});

describe("dismissAutoMatchBanner — 256-cap", () => {
  const fillCap = async (
    repo: ReturnType<typeof createInMemoryAutoMatchDismissalRepository>
  ) => {
    for (let i = 0; i < 256; i++) {
      await dismissAutoMatchBanner(
        { ...baseInput, activityId: `a${i}`, workoutId: `w${i}` },
        { repository: repo, clock: () => NOW_1 }
      );
    }
  };

  it("the 257th distinct pair is a no-op (row unchanged, warning emitted)", async () => {
    const repo = createInMemoryAutoMatchDismissalRepository();
    const logger = { warn: vi.fn() };
    await fillCap(repo);

    await dismissAutoMatchBanner(
      { ...baseInput, activityId: "a257", workoutId: "w257" },
      { repository: repo, clock: () => NOW_2, logger }
    );

    const stored = await repo.getByProfileAndWeek("p1", "2026-04-27");
    expect(stored?.dismissedPairs).toHaveLength(256);
    expect(stored?.dismissedPairs.some((p) => p.activityId === "a257")).toBe(
      false
    );
    expect(logger.warn).toHaveBeenCalledWith(
      "dismissAutoMatchBanner: cap reached"
    );
  });

  it("warning message is a static literal (no identifier interpolation)", async () => {
    const repo = createInMemoryAutoMatchDismissalRepository();
    const logger = { warn: vi.fn() };
    await fillCap(repo);

    await dismissAutoMatchBanner(
      { ...baseInput, activityId: "a-leak", workoutId: "w-leak" },
      { repository: repo, clock: () => NOW_2, logger }
    );

    const message = (logger.warn as ReturnType<typeof vi.fn>).mock
      .calls[0]?.[0];
    expect(message).toBe("dismissAutoMatchBanner: cap reached");
    expect(message).not.toContain("a-leak");
    expect(message).not.toContain("w-leak");
    expect(message).not.toContain("p1");
  });

  it("re-dismiss at the cap updates the existing entry without violating the cap", async () => {
    const repo = createInMemoryAutoMatchDismissalRepository();
    await fillCap(repo);

    await dismissAutoMatchBanner(
      { ...baseInput, activityId: "a0", workoutId: "w0" },
      { repository: repo, clock: () => NOW_2 }
    );

    const stored = await repo.getByProfileAndWeek("p1", "2026-04-27");
    expect(stored?.dismissedPairs).toHaveLength(256);
    const updated = stored?.dismissedPairs.find((p) => p.activityId === "a0");
    expect(updated?.dismissedAt).toBe(NOW_2);
  });
});
