import { describe, expect, it } from "vitest";

import { isActiveSport } from "./sports";

describe("isActiveSport", () => {
  it("should accept cycling, running, and swimming", () => {
    // Arrange
    const activeSports = ["cycling", "running", "swimming"];

    // Act
    const results = activeSports.map(isActiveSport);

    // Assert
    expect(results).toEqual([true, true, true]);
  });

  it("should reject a training sport so it gets no power or pace zones", () => {
    // Arrange
    const sport = "training";

    // Act
    const result = isActiveSport(sport);

    // Assert
    expect(result).toBe(false);
  });

  it("should reject generic and other non-active sports", () => {
    // Arrange
    const nonActive = ["generic", "rowing", "hiking", "tennis"];

    // Act
    const results = nonActive.map(isActiveSport);

    // Assert
    expect(results).toEqual([false, false, false, false]);
  });
});
