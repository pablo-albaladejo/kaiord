import { describe, expect, it } from "vitest";

import { trainingZonesSchema } from "./training-zones";

const validZones = {
  kind: "training_zones" as const,
  sport: "cycling",
  threshold: 250,
  sets: [
    {
      metric: "power" as const,
      method: "ftp",
      bands: [
        { zone: 1, min: 0, max: 137, label: "Recovery" },
        { zone: 2, min: 138, max: 187 },
        { zone: 7, min: 500 },
      ],
    },
  ],
};

describe("trainingZonesSchema", () => {
  it("should accept a per-sport power zone set", () => {
    // Arrange

    // Act
    const result = trainingZonesSchema.safeParse(validZones);

    // Assert
    expect(result.success).toBe(true);
  });

  it("should reject a zone band with a zero-or-negative index", () => {
    // Arrange
    const invalid = {
      ...validZones,
      sets: [
        { metric: "power" as const, bands: [{ zone: 0, min: 0, max: 100 }] },
      ],
    };

    // Act
    const result = trainingZonesSchema.safeParse(invalid);

    // Assert
    expect(result.success).toBe(false);
  });

  it("should reject an unknown metric", () => {
    // Arrange
    const invalid = {
      ...validZones,
      sets: [{ metric: "cadence", bands: [] }],
    };

    // Act
    const result = trainingZonesSchema.safeParse(invalid);

    // Assert
    expect(result.success).toBe(false);
  });
});
