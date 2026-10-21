import { describe, expect, it } from "vitest";

import { localClockOf } from "./health-clock";

const EPOCH_MS = 1_717_228_800_000;

describe("localClockOf", () => {
  it("should read a full ISO date-time as its local clock", () => {
    // Arrange
    const instant = new Date("2026-06-01T07:45:00");

    // Act
    const clock = localClockOf(instant.toISOString());

    // Assert
    expect(clock).toBe("07:45");
  });

  it.each([
    ["1"],
    ["2026-06-01"],
    ["Mon, 01 Jun 2026 07:45:00 GMT"],
    ["2026-06-01T99:99"],
    [""],
  ])("should return null for %j", (value) => {
    // Arrange

    // Act
    const clock = localClockOf(value);

    // Assert
    expect(clock).toBeNull();
  });

  it("should return null for a non-string", () => {
    // Arrange

    // Act
    const clock = localClockOf(EPOCH_MS);

    // Assert
    expect(clock).toBeNull();
  });
});
