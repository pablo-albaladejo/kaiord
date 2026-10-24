import { describe, expect, it } from "vitest";

import { estimateZoneProfile } from "./estimate-zone-profile";
import {
  MIN_2,
  MIN_3,
  MIN_3_30,
  MIN_5,
  MIN_10,
  MIN_15,
  reps,
  SEC_30,
  seg,
  THREE_TIMES,
  TWO_TIMES,
  Z1,
  Z2,
  Z4,
  Z5,
} from "./estimate-zone-profile.test-fixtures";

describe("estimateZoneProfile (set rest)", () => {
  it("should place R: set rest between repeats and not after the last", () => {
    // Arrange
    const text = "3x(5' Z4), R: 2', 10' Z2";

    // Act
    const segments = estimateZoneProfile(text);

    // Assert
    expect(segments).toEqual([
      ...reps(TWO_TIMES, seg(Z4, MIN_5), seg(Z1, MIN_2)),
      seg(Z4, MIN_5),
      seg(Z2, MIN_10),
    ]);
  });

  it.each(["rest: 2'", "rec: 2'", "descanso: 2'", "recuperación: 2'"])(
    "should accept %s as set rest",
    (rest) => {
      // Arrange
      const text = `4x(3' z4), ${rest}`;

      // Act
      const segments = estimateZoneProfile(text);

      // Assert
      expect(segments).toEqual([
        ...reps(THREE_TIMES, seg(Z4, MIN_3), seg(Z1, MIN_2)),
        seg(Z4, MIN_3),
      ]);
    }
  );

  it("should let an explicit zone on the set rest override Z1", () => {
    // Arrange
    const text = "4x(3' z4), R: 2' z2";

    // Act
    const segments = estimateZoneProfile(text);

    // Assert
    expect(segments).toEqual([
      ...reps(THREE_TIMES, seg(Z4, MIN_3), seg(Z2, MIN_2)),
      seg(Z4, MIN_3),
    ]);
  });

  it("should apply R: inside a group to that group's repeat", () => {
    // Arrange
    const text = '3x(4x(30" z5 + 30" z1), R: 3\')';
    const set = [
      ...reps(THREE_TIMES, seg(Z5, SEC_30), seg(Z1, SEC_30)),
      seg(Z5, SEC_30),
    ];

    // Act
    const segments = estimateZoneProfile(text);

    // Assert
    expect(segments).toEqual([
      ...set,
      seg(Z1, MIN_3_30),
      ...set,
      seg(Z1, MIN_3_30),
      ...set,
      seg(Z1, SEC_30),
    ]);
  });
});

describe("estimateZoneProfile (merging and empty results)", () => {
  it("should merge consecutive same-zone and consecutive unzoned spans", () => {
    // Arrange
    const text = "5' z1 + 10' suave + 5' contrastes + 10' fartlek + 5' z4";

    // Act
    const segments = estimateZoneProfile(text);

    // Assert
    expect(segments).toEqual([
      seg(Z1, MIN_15),
      seg(null, MIN_15),
      seg(Z4, MIN_5),
    ]);
  });

  it.each([
    "45 minute strength training session",
    "workout for tomorrow morning, something moderate",
  ])("should return no estimate for %s", (text) => {
    // Arrange
    const expected: Array<unknown> = [];

    // Act
    const segments = estimateZoneProfile(text);

    // Assert
    expect(segments).toEqual(expected);
  });
});
