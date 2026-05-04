import { describe, expect, it } from "vitest";

import { createInMemoryUserPreferencesRepository } from "../test-utils/in-memory-user-preferences-repository";
import { getUserPreferences } from "./get-user-preferences";

const fixedClock = () => "2026-05-01T12:00:00.000Z";

describe("getUserPreferences", () => {
  it("should return the persisted row when one exists", async () => {
    // Arrange
    const repo = createInMemoryUserPreferencesRepository();
    await repo.put({
      profileId: "p1",
      calendarDensity: "comfortable",
      updatedAt: "2026-04-30T10:00:00.000Z",
    });

    // Act
    const result = await getUserPreferences(
      { profileId: "p1" },
      { repository: repo, clock: fixedClock }
    );

    // Assert
    expect(result).toEqual({
      profileId: "p1",
      calendarDensity: "comfortable",
      updatedAt: "2026-04-30T10:00:00.000Z",
    });
  });

  it("should return the synthesised default when no row exists (no write)", async () => {
    // Arrange
    const repo = createInMemoryUserPreferencesRepository();

    // Act
    const result = await getUserPreferences(
      { profileId: "p1", defaultDensity: "compact" },
      { repository: repo, clock: fixedClock }
    );

    // Assert
    expect(result).toEqual({
      profileId: "p1",
      calendarDensity: "compact",
      updatedAt: "2026-05-01T12:00:00.000Z",
    });
    expect(await repo.get("p1")).toBeUndefined();
  });

  it("should fall back to compact when no defaultDensity provided", async () => {
    // Arrange
    const repo = createInMemoryUserPreferencesRepository();

    // Act
    const result = await getUserPreferences(
      { profileId: "p1" },
      { repository: repo, clock: fixedClock }
    );

    // Assert
    expect(result.calendarDensity).toBe("compact");
  });

  it("should use comfortable default when caller passes it (mobile viewport)", async () => {
    // Arrange
    const repo = createInMemoryUserPreferencesRepository();

    // Act
    const result = await getUserPreferences(
      { profileId: "p1", defaultDensity: "comfortable" },
      { repository: repo, clock: fixedClock }
    );

    // Assert
    expect(result.calendarDensity).toBe("comfortable");
  });
});
