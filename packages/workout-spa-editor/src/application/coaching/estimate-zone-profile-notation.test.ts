import { describe, expect, it } from "vitest";

import { estimateZoneProfile } from "./estimate-zone-profile";
import {
  MIN_2,
  MIN_5,
  MIN_10,
  MIN_15,
  MIN_20,
  MIN_30,
  MIN_40,
  MIN_45,
  reps,
  seg,
  THREE_TIMES,
  Z1,
  Z2,
  Z4,
} from "./estimate-zone-profile.test-fixtures";

describe("estimateZoneProfile (pace and alternatives)", () => {
  it.each([
    ["20' z2 a 4'30\"/km", seg(Z2, MIN_20)],
    ["20' z2 a 4:30 min/km", seg(Z2, MIN_20)],
    ["Rodaje 40' z2 ritmo 5'/km", seg(Z2, MIN_40)],
    ["40' o 50' z2", seg(Z2, MIN_40)],
    ["40 or 50 min easy", seg(Z1, MIN_40)],
  ])(
    "should read %s as one span without the pace or the upper choice",
    (text, expected) => {
      // Arrange
      const wanted = [expected];

      // Act
      const segments = estimateZoneProfile(text);

      // Assert
      expect(segments).toEqual(wanted);
    }
  );

  it("should keep a repeat whose work names a pace", () => {
    // Arrange
    const text = "3x(5' a 4'10\"/km + 2' trote)";

    // Act
    const segments = estimateZoneProfile(text);

    // Assert
    expect(segments).toEqual(
      reps(THREE_TIMES, seg(null, MIN_5), seg(Z1, MIN_2))
    );
  });

  it.each([
    ["1/2 h z2", MIN_30],
    ["media hora z2", MIN_30],
    ["3/4 h z2", MIN_45],
    ["1/4 hora z2", MIN_15],
  ])("should read the fraction of an hour in %s", (text, seconds) => {
    // Arrange
    const expected = [seg(Z2, seconds)];

    // Act
    const segments = estimateZoneProfile(text);

    // Assert
    expect(segments).toEqual(expected);
  });

  it.each([
    "20' z2, hidratar a los 30'",
    "20' z2, gel en el minuto 10'",
    "20' z2, gel al minuto 10'",
  ])("should not count the time point in %s as a span", (text) => {
    // Arrange
    const expected = [seg(Z2, MIN_20)];

    // Act
    const segments = estimateZoneProfile(text);

    // Assert
    expect(segments).toEqual(expected);
  });
});

describe("estimateZoneProfile (ambiguous zones and nesting)", () => {
  it.each([
    "60' z2 con 4x30\" fuertes",
    "Z3 15' Z1 20'",
    "Z4 3x(5' + 2')",
    "Z4 3x5' z1",
    "5' z1, 3 veces 2' z4",
    "10' z1 (3x1' z4)",
    "Z2 60' (30' z1 + 30' z2)",
    "1' z4 after 20' z2",
    "20' z2, gel after 30'",
  ])("should return no estimate for %s", (text) => {
    // Arrange
    const expected: Array<unknown> = [];

    // Act
    const segments = estimateZoneProfile(text);

    // Assert
    expect(segments).toEqual(expected);
  });

  it("should give a zone written before a repeat to its work", () => {
    // Arrange
    const text = "Z4 3x5', Z1 10'";

    // Act
    const segments = estimateZoneProfile(text);

    // Assert
    expect(segments).toEqual([seg(Z4, MIN_15), seg(Z1, MIN_10)]);
  });

  it("should keep bracketed detail that agrees with its span's zone", () => {
    // Arrange
    const text = "20' z2 (1' z2 + 1' z2)";

    // Act
    const segments = estimateZoneProfile(text);

    // Assert
    expect(segments).toEqual([seg(Z2, MIN_20)]);
  });
});
