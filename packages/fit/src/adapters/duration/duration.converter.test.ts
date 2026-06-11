import type { Duration } from "@kaiord/core";
import { describe, expect, it } from "vitest";

import { buildFitDurationData } from "../../tests/fixtures/fit-duration.fixtures";
import { convertFitDuration } from "../duration/duration.converter";

// Dispatcher suite for convertFitDuration. It routes on `durationType` to a
// per-type leaf converter (duration-converters.ts / repeat-duration-converters.ts).
// The leaf converters have no co-located suites, so the two it.each tables below
// own the value-mapping proof: each row is one (type present -> mapped value)
// equivalence class, and the absent table is the (type present, value missing ->
// open) equivalence class. The dispatch-table block proves the routing/fallback.

type FitDurationFields = Parameters<typeof buildFitDurationData.build>[0];

describe("convertFitDuration", () => {
  describe("value-present durations map to their KRD shape", () => {
    it.each<[string, FitDurationFields, Duration]>([
      ["time", { durationType: "time", durationTime: 300 }, { type: "time", seconds: 300 }],
      [
        "distance",
        { durationType: "distance", durationDistance: 1000 },
        { type: "distance", meters: 1000 },
      ],
      [
        "hrLessThan",
        { durationType: "hrLessThan", durationHr: 140 },
        { type: "heart_rate_less_than", bpm: 140 },
      ],
      [
        "calories",
        { durationType: "calories", durationCalories: 500 },
        { type: "calories", calories: 500 },
      ],
      [
        "powerLessThan",
        { durationType: "powerLessThan", durationPower: 200 },
        { type: "power_less_than", watts: 200 },
      ],
      [
        "powerGreaterThan",
        { durationType: "powerGreaterThan", durationPower: 250 },
        { type: "power_greater_than", watts: 250 },
      ],
      [
        "repeatUntilTime",
        { durationType: "repeatUntilTime", durationTime: 1800, durationStep: 0 },
        { type: "repeat_until_time", seconds: 1800, repeatFrom: 0 },
      ],
      [
        "repeatUntilDistance",
        { durationType: "repeatUntilDistance", durationDistance: 5000, durationStep: 1 },
        { type: "repeat_until_distance", meters: 5000, repeatFrom: 1 },
      ],
      [
        "repeatUntilCalories",
        { durationType: "repeatUntilCalories", durationCalories: 1000, durationStep: 2 },
        { type: "repeat_until_calories", calories: 1000, repeatFrom: 2 },
      ],
      [
        "repeatUntilHrLessThan",
        { durationType: "repeatUntilHrLessThan", durationHr: 120, durationStep: 2 },
        { type: "repeat_until_heart_rate_less_than", bpm: 120, repeatFrom: 2 },
      ],
      [
        "repeatUntilHrGreaterThan",
        { durationType: "repeatUntilHrGreaterThan", repeatHr: 160, durationStep: 0 },
        { type: "repeat_until_heart_rate_greater_than", bpm: 160, repeatFrom: 0 },
      ],
      [
        "repeatUntilPowerLessThan",
        { durationType: "repeatUntilPowerLessThan", durationPower: 180, durationStep: 3 },
        { type: "repeat_until_power_less_than", watts: 180, repeatFrom: 3 },
      ],
      [
        "repeatUntilPowerGreaterThan",
        { durationType: "repeatUntilPowerGreaterThan", durationPower: 300, durationStep: 1 },
        { type: "repeat_until_power_greater_than", watts: 300, repeatFrom: 1 },
      ],
    ])("should map %s to its KRD duration", (_type, fields, expected) => {
      // Arrange
      const data = buildFitDurationData.build(fields);

      // Act
      const result = convertFitDuration(data);

      // Assert
      expect(result).toStrictEqual(expected);
    });
  });

  describe("value-absent durations fall back to open", () => {
    it.each<[string, FitDurationFields]>([
      ["time without durationTime", { durationType: "time" }],
      ["distance without durationDistance", { durationType: "distance" }],
      ["calories without durationCalories", { durationType: "calories" }],
      ["powerLessThan without durationPower", { durationType: "powerLessThan" }],
      [
        "repeatUntilCalories without durationStep",
        { durationType: "repeatUntilCalories", durationCalories: 800 },
      ],
      [
        "repeatUntilTime without durationStep",
        { durationType: "repeatUntilTime", durationTime: 600 },
      ],
      [
        "repeatUntilDistance without durationStep",
        { durationType: "repeatUntilDistance", durationDistance: 3000 },
      ],
      [
        "repeatUntilHrLessThan without durationStep",
        { durationType: "repeatUntilHrLessThan", durationHr: 130 },
      ],
      [
        "repeatUntilPowerLessThan without durationStep",
        { durationType: "repeatUntilPowerLessThan", durationPower: 150 },
      ],
      [
        "repeatUntilHrGreaterThan without durationStep",
        { durationType: "repeatUntilHrGreaterThan", repeatHr: 170 },
      ],
      [
        "repeatUntilHrGreaterThan without repeatHr",
        { durationType: "repeatUntilHrGreaterThan", durationStep: 1 },
      ],
    ])("should map %s to open", (_label, fields) => {
      // Arrange
      const data = buildFitDurationData.build(fields);

      // Act
      const result = convertFitDuration(data);

      // Assert
      expect(result).toStrictEqual({ type: "open" });
    });
  });

  describe("dispatch table routing and fallbacks", () => {
    it("should map an explicit open duration to open", () => {
      // Arrange
      const data = buildFitDurationData.build({ durationType: "open" });

      // Act
      const result = convertFitDuration(data);

      // Assert
      expect(result).toStrictEqual({ type: "open" });
    });

    it("should map a missing duration type to open", () => {
      // Arrange
      const data = buildFitDurationData.build({});

      // Act
      const result = convertFitDuration(data);

      // Assert
      expect(result).toStrictEqual({ type: "open" });
    });

    it("should map an unrecognised duration type to open", () => {
      // Arrange
      const data = buildFitDurationData.build({ durationType: "unknown_type" });

      // Act
      const result = convertFitDuration(data);

      // Assert
      expect(result).toStrictEqual({ type: "open" });
    });

    it("should map a valid type without a registered converter to open", () => {
      // Arrange
      const data = buildFitDurationData.build({
        durationType: "repeatUntilStepsCmplt",
        durationStep: 5,
      });

      // Act
      const result = convertFitDuration(data);

      // Assert
      expect(result).toStrictEqual({ type: "open" });
    });
  });
});
