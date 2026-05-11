import { describe, expect, it } from "vitest";

import { getValueLabel, getValuePlaceholder } from "./helpers-labels";

type TargetType = "power" | "heart_rate" | "pace" | "cadence" | "open";

describe("getValueLabel", () => {
  it.each<[TargetType, string, string]>([
    // unit === "range" early return takes priority over targetType
    ["power", "range", "Range"],
    ["heart_rate", "range", "Range"],
    ["pace", "range", "Range"],
    ["cadence", "range", "Range"],
    ["open", "range", "Range"],
    // power switch arms
    ["power", "watts", "Power (watts)"],
    ["power", "percent_ftp", "Power (% FTP)"],
    ["power", "zone", "Power Zone (1-7)"],
    ["power", "__unknown__", "Power Value"],
    // heart_rate switch arms
    ["heart_rate", "bpm", "Heart Rate (BPM)"],
    ["heart_rate", "zone", "HR Zone (1-5)"],
    ["heart_rate", "percent_max", "Heart Rate (% Max)"],
    ["heart_rate", "__unknown__", "Heart Rate Value"],
    // pace switch arms
    ["pace", "mps", "Pace (m/s)"],
    ["pace", "zone", "Pace Zone (1-5)"],
    ["pace", "__unknown__", "Pace Value"],
    // cadence switch arms
    ["cadence", "rpm", "Cadence (RPM)"],
    ["cadence", "__unknown__", "Cadence Value"],
    // open is the default switch arm
    ["open", "watts", "Value"],
    ["open", "rpm", "Value"],
    ["open", "__unknown__", "Value"],
  ])(
    "should return %s for targetType=%s unit=%s",
    (targetType, unit, expected) => {
      // Arrange
      const tt = targetType;
      const u = unit;

      // Act
      const actual = getValueLabel(tt, u);

      // Assert
      expect(actual).toBe(expected);
    }
  );
});

describe("getValuePlaceholder", () => {
  it.each<[TargetType, string, string]>([
    // unit === "range" early return
    ["power", "range", ""],
    ["heart_rate", "range", ""],
    ["pace", "range", ""],
    ["cadence", "range", ""],
    ["open", "range", ""],
    // power
    ["power", "watts", "e.g., 250"],
    ["power", "percent_ftp", "e.g., 85"],
    ["power", "zone", "1-7"],
    ["power", "__unknown__", "Enter value"],
    // heart_rate
    ["heart_rate", "bpm", "e.g., 150"],
    ["heart_rate", "zone", "1-5"],
    ["heart_rate", "percent_max", "e.g., 85"],
    ["heart_rate", "__unknown__", "Enter value"],
    // pace
    ["pace", "mps", "e.g., 3.5"],
    ["pace", "zone", "1-5"],
    ["pace", "__unknown__", "Enter value"],
    // cadence
    ["cadence", "rpm", "e.g., 90"],
    ["cadence", "__unknown__", "Enter value"],
    // default arm (open)
    ["open", "watts", "Enter value"],
    ["open", "rpm", "Enter value"],
    ["open", "__unknown__", "Enter value"],
  ])(
    "should return placeholder %s for targetType=%s unit=%s",
    (targetType, unit, expected) => {
      // Arrange
      const tt = targetType;
      const u = unit;

      // Act
      const actual = getValuePlaceholder(tt, u);

      // Assert
      expect(actual).toBe(expected);
    }
  );
});
