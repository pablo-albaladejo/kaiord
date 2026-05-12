import { describe, expect, it } from "vitest";

import type { Duration } from "../../../../types/krd";
import {
  getDurationTypeFromValue,
  getRepeatFromValue,
  getValueFromDuration,
  getValueLabel,
  isRepeatType,
} from "./duration-helpers";
import {
  type AdvancedDurationType,
  DURATION_TYPE_OPTIONS,
} from "./duration-type-options";

const DURATION_FIXTURES: Record<AdvancedDurationType, Duration> = {
  calories: { type: "calories", calories: 120 },
  power_less_than: { type: "power_less_than", watts: 250 },
  power_greater_than: { type: "power_greater_than", watts: 250 },
  heart_rate_less_than: { type: "heart_rate_less_than", bpm: 150 },
  repeat_until_time: {
    type: "repeat_until_time",
    seconds: 600,
    repeatFrom: 1,
  },
  repeat_until_distance: {
    type: "repeat_until_distance",
    meters: 5000,
    repeatFrom: 2,
  },
  repeat_until_calories: {
    type: "repeat_until_calories",
    calories: 120,
    repeatFrom: 3,
  },
  repeat_until_heart_rate_greater_than: {
    type: "repeat_until_heart_rate_greater_than",
    bpm: 150,
    repeatFrom: 4,
  },
  repeat_until_heart_rate_less_than: {
    type: "repeat_until_heart_rate_less_than",
    bpm: 150,
    repeatFrom: 5,
  },
  repeat_until_power_less_than: {
    type: "repeat_until_power_less_than",
    watts: 250,
    repeatFrom: 6,
  },
  repeat_until_power_greater_than: {
    type: "repeat_until_power_greater_than",
    watts: 250,
    repeatFrom: 7,
  },
};

const ALL_TYPES: Array<AdvancedDurationType> = DURATION_TYPE_OPTIONS.map(
  (o) => o.value
);

const VALUE_FROM_DURATION_EXPECTED: Record<AdvancedDurationType, string> = {
  calories: "120",
  power_less_than: "250",
  power_greater_than: "250",
  heart_rate_less_than: "150",
  repeat_until_time: "600",
  repeat_until_distance: "5000",
  repeat_until_calories: "120",
  repeat_until_heart_rate_greater_than: "150",
  repeat_until_heart_rate_less_than: "150",
  repeat_until_power_less_than: "250",
  repeat_until_power_greater_than: "250",
};

const REPEAT_FROM_EXPECTED: Record<AdvancedDurationType, string> = {
  calories: "0",
  power_less_than: "0",
  power_greater_than: "0",
  heart_rate_less_than: "0",
  repeat_until_time: "1",
  repeat_until_distance: "2",
  repeat_until_calories: "3",
  repeat_until_heart_rate_greater_than: "4",
  repeat_until_heart_rate_less_than: "5",
  repeat_until_power_less_than: "6",
  repeat_until_power_greater_than: "7",
};

const VALUE_LABEL_EXPECTED: Record<AdvancedDurationType, string> = {
  calories: "Calories",
  power_less_than: "Power (watts)",
  power_greater_than: "Power (watts)",
  heart_rate_less_than: "Heart Rate (bpm)",
  repeat_until_time: "Time (seconds)",
  repeat_until_distance: "Distance (meters)",
  repeat_until_calories: "Calories",
  repeat_until_heart_rate_greater_than: "Heart Rate (bpm)",
  repeat_until_heart_rate_less_than: "Heart Rate (bpm)",
  repeat_until_power_less_than: "Power (watts)",
  repeat_until_power_greater_than: "Power (watts)",
};

const REPEAT_TYPES: Array<AdvancedDurationType> = [
  "repeat_until_time",
  "repeat_until_distance",
  "repeat_until_calories",
  "repeat_until_heart_rate_greater_than",
  "repeat_until_heart_rate_less_than",
  "repeat_until_power_less_than",
  "repeat_until_power_greater_than",
];

const NON_REPEAT_TYPES: Array<AdvancedDurationType> = [
  "calories",
  "power_less_than",
  "power_greater_than",
  "heart_rate_less_than",
];

describe("getDurationTypeFromValue", () => {
  it("should return calories when value is null", () => {
    // Arrange
    const value = null;

    // Act
    const actual = getDurationTypeFromValue(value);

    // Assert
    expect(actual).toBe("calories");
  });

  it("should return calories for unrecognised duration type", () => {
    // Arrange
    const value = { type: "open" } as unknown as Duration;

    // Act
    const actual = getDurationTypeFromValue(value);

    // Assert
    expect(actual).toBe("calories");
  });

  it.each(ALL_TYPES.map((t) => [t] as const))(
    "should return %s when duration.type matches the advanced enum",
    (durationType) => {
      // Arrange
      const value = DURATION_FIXTURES[durationType];

      // Act
      const actual = getDurationTypeFromValue(value);

      // Assert
      expect(actual).toBe(durationType);
    }
  );
});

describe("getValueFromDuration", () => {
  it("should return empty string when value is null", () => {
    // Arrange
    const value = null;

    // Act
    const actual = getValueFromDuration(value);

    // Assert
    expect(actual).toBe("");
  });

  it("should return empty string for unrecognised duration type", () => {
    // Arrange
    const value = { type: "open" } as unknown as Duration;

    // Act
    const actual = getValueFromDuration(value);

    // Assert
    expect(actual).toBe("");
  });

  it.each(ALL_TYPES.map((t) => [t] as const))(
    "should return numeric string for %s",
    (durationType) => {
      // Arrange
      const value = DURATION_FIXTURES[durationType];
      const expected = VALUE_FROM_DURATION_EXPECTED[durationType];

      // Act
      const actual = getValueFromDuration(value);

      // Assert
      expect(actual).toBe(expected);
    }
  );
});

describe("getRepeatFromValue", () => {
  it("should return 0 when value is null", () => {
    // Arrange
    const value = null;

    // Act
    const actual = getRepeatFromValue(value);

    // Assert
    expect(actual).toBe("0");
  });

  it("should return 0 for unrecognised duration type", () => {
    // Arrange
    const value = { type: "open" } as unknown as Duration;

    // Act
    const actual = getRepeatFromValue(value);

    // Assert
    expect(actual).toBe("0");
  });

  it.each(ALL_TYPES.map((t) => [t] as const))(
    "should return repeatFrom string for %s",
    (durationType) => {
      // Arrange
      const value = DURATION_FIXTURES[durationType];
      const expected = REPEAT_FROM_EXPECTED[durationType];

      // Act
      const actual = getRepeatFromValue(value);

      // Assert
      expect(actual).toBe(expected);
    }
  );
});

describe("getValueLabel", () => {
  it("should return empty string for an unrecognised duration type cast", () => {
    // Arrange
    const durationType = "__unknown__" as AdvancedDurationType;

    // Act
    const actual = getValueLabel(durationType);

    // Assert
    expect(actual).toBe("");
  });

  it.each(ALL_TYPES.map((t) => [t] as const))(
    "should return literal label for %s",
    (durationType) => {
      // Arrange
      const expected = VALUE_LABEL_EXPECTED[durationType];

      // Act
      const actual = getValueLabel(durationType);

      // Assert
      expect(actual).toBe(expected);
    }
  );
});

describe("isRepeatType", () => {
  it.each(REPEAT_TYPES.map((t) => [t] as const))(
    "should return true for %s",
    (durationType) => {
      // Arrange

      // Act
      const actual = isRepeatType(durationType);

      // Assert
      expect(actual).toBe(true);
    }
  );

  it.each(NON_REPEAT_TYPES.map((t) => [t] as const))(
    "should return false for %s",
    (durationType) => {
      // Arrange

      // Act
      const actual = isRepeatType(durationType);

      // Assert
      expect(actual).toBe(false);
    }
  );
});
