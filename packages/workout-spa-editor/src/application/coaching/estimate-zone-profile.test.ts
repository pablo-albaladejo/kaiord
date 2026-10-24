import { describe, expect, it } from "vitest";

import { estimateZoneProfile } from "./estimate-zone-profile";
import {
  MIN_2,
  MIN_3,
  MIN_5,
  MIN_10,
  MIN_12,
  MIN_15,
  MIN_20,
  MIN_30,
  MIN_42,
  reps,
  seg,
  THREE_TIMES,
  total,
  Z1,
  Z2,
  Z3,
  Z4,
  Z5,
} from "./estimate-zone-profile.test-fixtures";

describe("estimateZoneProfile (spec scenarios)", () => {
  it("should expand explicit zones and a repeat into a 42-minute profile", () => {
    // Arrange
    const text = "12' Z1, 4x(3' Z4 + 2' Z1), 10' Z1";

    // Act
    const segments = estimateZoneProfile(text);

    // Assert
    expect(total(segments)).toBe(MIN_42);
    expect(segments).toEqual([
      seg(Z1, MIN_12),
      ...reps(THREE_TIMES, seg(Z4, MIN_3), seg(Z1, MIN_2)),
      seg(Z4, MIN_3),
      seg(Z1, MIN_2 + MIN_10),
    ]);
  });

  it("should keep an unzoned span as a null segment of its true width", () => {
    // Arrange
    const text = "10' z1 + 30' contrastes";

    // Act
    const segments = estimateZoneProfile(text);

    // Assert
    expect(segments).toEqual([seg(Z1, MIN_10), seg(null, MIN_30)]);
  });

  it("should return no estimate when a segment is measured by distance", () => {
    // Arrange
    const text = "20' z1, 3x(1K progresivo + 2' trote)";

    // Act
    const segments = estimateZoneProfile(text);

    // Assert
    expect(segments).toEqual([]);
  });
});

describe("estimateZoneProfile (zone resolution)", () => {
  it.each([
    ["5' RPE 1", Z1],
    ["5' RPE 2-3", Z1],
    ["5' RPE 4", Z2],
    ["5' RPE 5-6", Z3],
    ["5' RPE 7", Z4],
    ["5' RPE 9-10", Z5],
    ["5' suave", Z1],
    ["5' recuperación", Z1],
    ["5 min cool down", Z1],
    ["5' resistencia aeróbica", Z2],
    ["5 minutes steady", Z2],
    ["5' sweet spot", Z3],
    ["5' ritmo maratón", Z3],
    ["5' umbral", Z4],
    ["5' FUERTE", Z4],
    ["5' all-out", Z5],
    ["5' máximo", Z5],
    ["5' Z2-Z3", Z2],
    ["5' zona 2", Z2],
    ["5' Zone 2", Z2],
    ["5' fuerte Z2 RPE 9", Z2],
    ['"Z2" 5\'', Z2],
    ["Z2 - 5 min", Z2],
    ["5' z2 sin pasar de z3", Z2],
  ])("should resolve %s to its zone", (text, zone) => {
    // Arrange
    const expected = [seg(zone, MIN_5)];

    // Act
    const segments = estimateZoneProfile(text);

    // Assert
    expect(segments).toEqual(expected);
  });

  it("should not read a ceiling's maximum as a Z5 word", () => {
    // Arrange
    const text = "10' z1, 30' máximo Z3";

    // Act
    const segments = estimateZoneProfile(text);

    // Assert
    expect(segments).toEqual([seg(Z1, MIN_10), seg(null, MIN_30)]);
  });

  it("should let RPE beat a word and ignore the colon after RPE", () => {
    // Arrange
    const text = "10' trote RPE: 3, 20' z2";

    // Act
    const segments = estimateZoneProfile(text);

    // Assert
    expect(segments).toEqual([seg(Z2, MIN_10 + MIN_20)]);
  });

  it.each(["5' hardware", "5' hard at 105% FTP", "15' progresivo de Z2 a Z3"])(
    "should find no zone in %s",
    (text) => {
      // Arrange
      const expected: Array<unknown> = [];

      // Act
      const segments = estimateZoneProfile(text);

      // Assert
      expect(segments).toEqual(expected);
    }
  );

  it("should leave progressions, % FTP and effort words beside them unzoned", () => {
    // Arrange
    const text =
      "10' z1 + 5' progresivo hasta fuerte + 5' hard at 105% FTP + 15' progresivo de Z1 a Z4";

    // Act
    const segments = estimateZoneProfile(text);

    // Assert
    expect(segments).toEqual([
      seg(Z1, MIN_10),
      seg(null, MIN_5 + MIN_5 + MIN_15),
    ]);
  });
});
