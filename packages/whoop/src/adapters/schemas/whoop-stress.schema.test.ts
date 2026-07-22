import { describe, expect, it } from "vitest";

import {
  STRESS_BFF_FIXTURE,
  STRESS_POINT_HIGH,
  STRESS_POINT_LOW,
} from "../../test-utils/stress-fixture";
import {
  extractStressPoints,
  whoopStressResponseSchema,
} from "./whoop-stress.schema";

describe("whoopStressResponseSchema", () => {
  it("should parse a well-formed stress-bff response", () => {
    // Arrange

    // Act
    const result = whoopStressResponseSchema.safeParse(STRESS_BFF_FIXTURE);

    // Assert
    expect(result.success).toBe(true);
  });

  it("should tolerate a response with only a gauge and no stress_graph", () => {
    // Arrange
    const payload = { gauge: { gauge_fill_percentage: 0.5 } };

    // Act
    const result = whoopStressResponseSchema.safeParse(payload);

    // Assert
    expect(result.success).toBe(true);
  });

  it("should tolerate an absent gauge", () => {
    // Arrange
    const payload = {};

    // Act
    const result = whoopStressResponseSchema.safeParse(payload);

    // Assert
    expect(result.success).toBe(true);
  });
});

describe("extractStressPoints", () => {
  it("should extract position_y values from a well-formed stress_graph", () => {
    // Arrange
    const parsed = whoopStressResponseSchema.parse(STRESS_BFF_FIXTURE);

    // Act
    const points = extractStressPoints(parsed);

    // Assert
    expect(points).toEqual([STRESS_POINT_LOW, STRESS_POINT_HIGH]);
  });

  it("should return an empty array when stress_graph is absent", () => {
    // Arrange
    const parsed = whoopStressResponseSchema.parse({});

    // Act
    const points = extractStressPoints(parsed);

    // Assert
    expect(points).toEqual([]);
  });

  it("should return an empty array when stress_graph is null", () => {
    // Arrange
    const parsed = whoopStressResponseSchema.parse({ stress_graph: null });

    // Act
    const points = extractStressPoints(parsed);

    // Assert
    expect(points).toEqual([]);
  });

  it("should return an empty array when plots is not an array", () => {
    // Arrange
    const parsed = whoopStressResponseSchema.parse({
      stress_graph: { graph: { plots: "not-an-array" } },
    });

    // Act
    const points = extractStressPoints(parsed);

    // Assert
    expect(points).toEqual([]);
  });

  it("should skip a plot entry whose segments are missing or malformed", () => {
    // Arrange
    const parsed = whoopStressResponseSchema.parse({
      stress_graph: {
        graph: {
          plots: [{ plot: {} }, { plot: { segments: "nope" } }],
        },
      },
    });

    // Act
    const points = extractStressPoints(parsed);

    // Assert
    expect(points).toEqual([]);
  });

  it("should skip a segment whose points are missing or malformed", () => {
    // Arrange
    const parsed = whoopStressResponseSchema.parse({
      stress_graph: {
        graph: { plots: [{ plot: { segments: [{}, { points: "nope" }] } }] },
      },
    });

    // Act
    const points = extractStressPoints(parsed);

    // Assert
    expect(points).toEqual([]);
  });

  it("should skip a point whose position_y is not a number", () => {
    // Arrange
    const parsed = whoopStressResponseSchema.parse({
      stress_graph: {
        graph: {
          plots: [
            {
              plot: {
                segments: [
                  {
                    points: [
                      { position_y: "0.4" },
                      { position_y: STRESS_POINT_HIGH },
                    ],
                  },
                ],
              },
            },
          ],
        },
      },
    });

    // Act
    const points = extractStressPoints(parsed);

    // Assert
    expect(points).toEqual([STRESS_POINT_HIGH]);
  });
});
