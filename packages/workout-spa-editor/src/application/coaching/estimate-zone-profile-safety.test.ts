import { describe, expect, it } from "vitest";

import { estimateZoneProfile } from "./estimate-zone-profile";
import {
  HOUR_6,
  MIN_5,
  seg,
  Z1,
  Z2,
} from "./estimate-zone-profile.test-fixtures";

const MAX_INPUT_LENGTH = 4000;
const STEP = "5' z1 ";
const ALTERNATING_PAIR = '1" z1 + 1" z4';

describe("estimateZoneProfile (safety caps)", () => {
  it("should return no estimate for input longer than 4000 characters", () => {
    // Arrange
    const atCap = STEP + "a".repeat(MAX_INPUT_LENGTH - STEP.length);
    const overCap = `${atCap}a`;

    // Act
    const kept = estimateZoneProfile(atCap);
    const hidden = estimateZoneProfile(overCap);

    // Assert
    expect(kept).toEqual([seg(Z1, MIN_5)]);
    expect(hidden).toEqual([]);
  });

  it("should return no estimate for brackets nested deeper than three", () => {
    // Arrange
    const deep = "((((5' z1))))";
    const allowed = "(((5' z1)))";

    // Act
    const hidden = estimateZoneProfile(deep);
    const kept = estimateZoneProfile(allowed);

    // Assert
    expect(hidden).toEqual([]);
    expect(kept).toEqual([seg(Z1, MIN_5)]);
  });

  it("should return no estimate for unbalanced brackets", () => {
    // Arrange
    const text = "5' z1)";

    // Act
    const segments = estimateZoneProfile(text);

    // Assert
    expect(segments).toEqual([]);
  });

  it("should return no estimate for a group that opens and closes on different lines", () => {
    // Arrange
    const text = "10' z2\n(5' z1\n)";

    // Act
    const segments = estimateZoneProfile(text);

    // Assert
    expect(segments).toEqual([]);
  });

  it("should stop expanding nested repeats at the segment cap", () => {
    // Arrange
    const exploding = "99x(99x(99x(1' z1 + 1' z4)))";

    // Act
    const segments = estimateZoneProfile(exploding);

    // Assert
    expect(segments).toEqual([]);
  });

  it("should allow exactly 300 segments and refuse 320", () => {
    // Arrange
    const atCap = `3x(50x(${ALTERNATING_PAIR}))`;
    const overCap = `4x(40x(${ALTERNATING_PAIR}))`;
    const capSegments = 300;

    // Act
    const kept = estimateZoneProfile(atCap);
    const hidden = estimateZoneProfile(overCap);

    // Assert
    expect(kept).toHaveLength(capSegments);
    expect(hidden).toEqual([]);
  });

  it("should return no estimate for a session longer than six hours", () => {
    // Arrange
    const sixHours = "6h z2";
    const sevenHours = "7h z2";

    // Act
    const kept = estimateZoneProfile(sixHours);
    const hidden = estimateZoneProfile(sevenHours);

    // Assert
    expect(kept).toEqual([seg(Z2, HOUR_6)]);
    expect(hidden).toEqual([]);
  });

  it.each(["0x(5' z4)", "0x5' z4"])(
    "should return no estimate for the zero repeat count in %s",
    (text) => {
      // Arrange
      const expected: Array<unknown> = [];

      // Act
      const segments = estimateZoneProfile(text);

      // Assert
      expect(segments).toEqual(expected);
    }
  );

  it("should strip private-use characters before parsing", () => {
    // Arrange
    const text = "5' z\ue0001";

    // Act
    const segments = estimateZoneProfile(text);

    // Assert
    expect(segments).toEqual([seg(Z1, MIN_5)]);
  });
});
