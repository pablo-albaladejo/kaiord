import { describe, expect, it } from "vitest";

import { canonicalizeSport } from "./canonicalize-sport";

describe("canonicalizeSport", () => {
  it.each([
    // Train2Go-side aliases
    ["bike", "cycling"],
    ["BIKE", "cycling"],
    ["Bike", "cycling"],
    ["bici", "cycling"],
    ["ciclismo", "cycling"],
    ["mountainbike", "cycling"],
    ["mountain_bike", "cycling"],
    ["mountain-bike", "cycling"],
    ["stationarybike", "cycling"],
    ["indoor cycling", "cycling"],
    // Garmin/KRD-side names
    ["cycling", "cycling"],
    ["road", "cycling"],
    ["gravel", "cycling"],
    // Running family
    ["run", "running"],
    ["running", "running"],
    ["correr", "running"],
    ["carrera", "running"],
    ["trail", "running"],
    ["Trail Running", "running"],
    ["sprint", "running"],
    ["treadmill", "running"],
    // Swimming family
    ["swim", "swimming"],
    ["swimming", "swimming"],
    ["natacion", "swimming"],
    ["open water", "swimming"],
    ["lap_swimming", "swimming"],
  ])("should canonicalize %s -> %s", (input, expected) => {
    // Arrange

    // Act
    const result = canonicalizeSport(input);

    // Assert
    expect(result).toBe(expected);
  });

  it("should return null for an empty string", () => {
    // Arrange

    // Act
    const result = canonicalizeSport("");

    // Assert
    expect(result).toBeNull();
  });

  it("should return null for whitespace-only input", () => {
    // Arrange

    // Act
    const result = canonicalizeSport("   ");

    // Assert
    expect(result).toBeNull();
  });

  it("should return null for an unknown sport", () => {
    // Arrange

    // Act
    const result = canonicalizeSport("kayak");

    // Assert
    expect(result).toBeNull();
  });

  it("should never map across canonical families", () => {
    // Arrange

    // Act
    const cycling = canonicalizeSport("bike");
    const running = canonicalizeSport("run");
    const swimming = canonicalizeSport("swim");

    // Assert
    expect(cycling).toBe("cycling");
    expect(running).toBe("running");
    expect(swimming).toBe("swimming");
    expect(cycling).not.toBe(running);
    expect(running).not.toBe(swimming);
  });
});
