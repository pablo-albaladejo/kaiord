import { describe, expect, it } from "vitest";

import { isPastBasicHorizon } from "./trainingpeaks-planning-horizon";

// Instants are UTC so the decision is checked the same in every runner
// timezone: it must not depend on the browser's zone at all.
const MORNING_IN_MADRID = new Date("2026-11-23T08:00:00Z");
const AFTERNOON_IN_MADRID = new Date("2026-11-23T13:00:00Z");
const NOON_UTC = new Date("2026-11-23T12:00:00Z");
const ONE_AM_IN_KIRIBATI = new Date("2026-11-23T11:00:00Z");

describe("isPastBasicHorizon", () => {
  it("should flag the browser's tomorrow while an account at UTC-12 is still on yesterday", () => {
    // Arrange
    const tomorrowInMadrid = "2026-11-24";

    // Act
    const flagged = isPastBasicHorizon(tomorrowInMadrid, MORNING_IN_MADRID);

    // Assert
    expect(flagged).toBe(true);
  });

  it("should not flag today while an account at UTC-12 is still on yesterday", () => {
    // Arrange
    const todayInMadrid = "2026-11-23";

    // Act
    const flagged = isPastBasicHorizon(todayInMadrid, MORNING_IN_MADRID);

    // Assert
    expect(flagged).toBe(false);
  });

  it("should not flag tomorrow once every time zone has reached today", () => {
    // Arrange
    const tomorrow = "2026-11-24";

    // Act
    const flagged = [NOON_UTC, AFTERNOON_IN_MADRID].map((now) =>
      isPastBasicHorizon(tomorrow, now)
    );

    // Assert
    expect(flagged).toEqual([false, false]);
  });

  it("should flag the day after tomorrow at any hour", () => {
    // Arrange
    const afterTomorrow = "2026-11-25";

    // Act
    const flagged = [MORNING_IN_MADRID, AFTERNOON_IN_MADRID].map((now) =>
      isPastBasicHorizon(afterTomorrow, now)
    );

    // Assert
    expect(flagged).toEqual([true, true]);
  });

  it("should flag the browser's today at UTC+14 when an account at UTC-12 is two days behind", () => {
    // Arrange
    const todayInKiribati = "2026-11-24";

    // Act
    const flagged = isPastBasicHorizon(todayInKiribati, ONE_AM_IN_KIRIBATI);

    // Assert
    expect(flagged).toBe(true);
  });

  it("should not flag a past day", () => {
    // Arrange
    const yesterday = "2026-11-22";

    // Act
    const flagged = isPastBasicHorizon(yesterday, MORNING_IN_MADRID);

    // Assert
    expect(flagged).toBe(false);
  });
});
