/* eslint-disable no-magic-numbers -- literal Zwift durations */
import { describe, expect, it } from "vitest";

import { extractIntervals } from "./intervals-extractor";

describe("extractIntervals", () => {
  it("should follow the given document order across element types", () => {
    // Arrange
    const workout = {
      SteadyState: [{ "@_Duration": 1 }, { "@_Duration": 3 }],
      IntervalsT: { "@_Repeat": 2 },
    };

    // Act
    const intervals = extractIntervals(workout, [
      "SteadyState",
      "IntervalsT",
      "SteadyState",
    ]);

    // Assert
    expect(intervals.map((i) => i.type)).toStrictEqual([
      "SteadyState",
      "IntervalsT",
      "SteadyState",
    ]);
    expect(intervals[2]!.data).toStrictEqual({ "@_Duration": 3 });
  });

  it("should append intervals the order does not account for instead of dropping them", () => {
    // Arrange
    const workout = {
      SteadyState: [{ "@_Duration": 1 }, { "@_Duration": 2 }],
      FreeRide: { "@_Duration": 3 },
    };

    // Act
    const intervals = extractIntervals(workout, ["SteadyState"]);

    // Assert
    expect(intervals.map((i) => i.data["@_Duration"])).toStrictEqual([1, 2, 3]);
  });
});
