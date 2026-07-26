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
  it.each([
    {
      scenario: "a well-formed stress-bff response",
      payload: STRESS_BFF_FIXTURE,
    },
    {
      scenario: "a response with only a gauge and no stress_graph",
      payload: { gauge: { gauge_fill_percentage: 0.5 } },
    },
    { scenario: "an absent gauge", payload: {} },
  ])("should parse $scenario", ({ payload }) => {
    // Arrange

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

  it.each([
    { scenario: "stress_graph is absent", input: {} },
    { scenario: "stress_graph is null", input: { stress_graph: null } },
    {
      scenario: "plots is not an array",
      input: { stress_graph: { graph: { plots: "not-an-array" } } },
    },
    {
      scenario: "a plot entry's segments are missing or malformed",
      input: {
        stress_graph: {
          graph: { plots: [{ plot: {} }, { plot: { segments: "nope" } }] },
        },
      },
    },
    {
      scenario: "a segment's points are missing or malformed",
      input: {
        stress_graph: {
          graph: { plots: [{ plot: { segments: [{}, { points: "nope" }] } }] },
        },
      },
    },
  ])("should return an empty array when $scenario", ({ input }) => {
    // Arrange
    const parsed = whoopStressResponseSchema.parse(input);

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
