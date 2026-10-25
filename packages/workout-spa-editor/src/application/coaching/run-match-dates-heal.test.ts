import { describe, expect, it, vi } from "vitest";

import { PROFILE, seedSession, THU } from "../session-move.test-fixtures";
import { runMatchDatesHeal } from "./run-match-dates-heal";

const analyticsStub = () => ({ event: vi.fn(), pageView: vi.fn() });

describe("runMatchDatesHeal", () => {
  it("should report only the number of matches healed", async () => {
    // Arrange
    const persistence = await seedSession({ workout: { date: THU } });
    const analytics = analyticsStub();

    // Act
    await runMatchDatesHeal(persistence, analytics, { profileId: PROFILE });

    // Assert
    expect((await persistence.sessionMatch.getById("m"))?.date).toBe(THU);
    expect(analytics.event).toHaveBeenCalledWith(
      "coaching.match_dates.healed",
      {
        healed: 1,
      }
    );
  });

  it("should stay silent when nothing was stale", async () => {
    // Arrange
    const persistence = await seedSession();
    const analytics = analyticsStub();

    // Act
    await runMatchDatesHeal(persistence, analytics, { profileId: PROFILE });

    // Assert
    expect(analytics.event).not.toHaveBeenCalled();
  });

  it("should report a failure without throwing", async () => {
    // Arrange
    const persistence = await seedSession();
    vi.spyOn(persistence.sessionMatch, "listByProfile").mockRejectedValue(
      new Error("boom")
    );
    const analytics = analyticsStub();

    // Act
    const run = runMatchDatesHeal(persistence, analytics, {
      profileId: PROFILE,
    });

    // Assert
    await expect(run).resolves.toBeUndefined();
    expect(analytics.event).toHaveBeenCalledWith(
      "coaching.match_dates.heal_failed"
    );
  });
});
