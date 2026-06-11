import { describe, expect, it } from "vitest";

import { mapSportType } from "./workout-properties";

describe("mapSportType", () => {
  it("should map a running sport to run", () => {
    // Arrange
    const sport = "running";

    // Act
    const result = mapSportType(sport);

    // Assert
    expect(result).toBe("run");
  });

  it("should map a cycling sport to bike", () => {
    // Arrange
    const sport = "cycling";

    // Act
    const result = mapSportType(sport);

    // Assert
    expect(result).toBe("bike");
  });

  it("should collapse a non-endurance sport to bike", () => {
    // Arrange
    const sport = "training";

    // Act
    const result = mapSportType(sport);

    // Assert
    expect(result).toBe("bike");
  });

  it("should default to bike when sport is undefined", () => {
    // Arrange
    const sport = undefined;

    // Act
    const result = mapSportType(sport);

    // Assert
    expect(result).toBe("bike");
  });
});
