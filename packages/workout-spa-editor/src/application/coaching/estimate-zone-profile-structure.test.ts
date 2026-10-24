import { describe, expect, it } from "vitest";

import { estimateZoneProfile } from "./estimate-zone-profile";
import {
  EIGHT_TIMES,
  FOUR_TIMES,
  HOUR_1,
  HOUR_1_30,
  HOUR_2,
  MIN_1,
  MIN_1_30,
  MIN_2,
  MIN_2_30,
  MIN_3,
  MIN_4,
  MIN_5,
  MIN_10,
  MIN_12,
  MIN_15,
  MIN_20,
  MIN_45,
  reps,
  SEC_30,
  seg,
  SIX_TIMES,
  TEN_TIMES,
  THREE_TIMES,
  Z1,
  Z2,
  Z3,
  Z4,
  Z5,
} from "./estimate-zone-profile.test-fixtures";

describe("estimateZoneProfile (durations)", () => {
  it.each([
    ["12' z1", MIN_12],
    ['30" z1', SEC_30],
    ["30'' z1", SEC_30],
    ["30sg z1", SEC_30],
    ["30s z1", SEC_30],
    ["30 seg z1", SEC_30],
    ["5 min z1", MIN_5],
    ["5 minutos z1", MIN_5],
    ["5 minutes z1", MIN_5],
    ["1h z1", HOUR_1],
    ["1h30 z1", HOUR_1_30],
    ["1 hora z1", HOUR_1],
    ["1'30\" z1", MIN_1_30],
    ["1'30 z1", MIN_1_30],
    ["1,5h z1", HOUR_1_30],
    ["1.5h z1", HOUR_1_30],
    ["2.5' z1", MIN_2_30],
    ["0.5' z1", SEC_30],
    ["1:30h z1", HOUR_1_30],
    ["1hr 30min z1", HOUR_1_30],
    ["2 hrs z1", HOUR_2],
    ["10/12' z1", MIN_10],
    ["10 a 12' z1", MIN_10],
    ["entre 10 y 12' z1", MIN_10],
    ["45'/50' z1", MIN_45],
    ["45' / 50' z1", MIN_45],
  ])("should read %s as a timed span", (text, seconds) => {
    // Arrange
    const expected = [seg(Z1, seconds)];

    // Act
    const segments = estimateZoneProfile(text);

    // Assert
    expect(segments).toEqual(expected);
  });

  it.each(["a las 7:00, 45' z2", "45' z2 a las 7:00"])(
    "should not read the clock time in %s as a duration",
    (text) => {
      // Arrange
      const expected = [seg(Z2, MIN_45)];

      // Act
      const segments = estimateZoneProfile(text);

      // Assert
      expect(segments).toEqual(expected);
    }
  );

  it.each(["10' z1, 400m z4", "1.5km z2", "10' z1 + 1K fuerte"])(
    "should return no estimate when %s names a distance",
    (text) => {
      // Arrange
      const expected: Array<unknown> = [];

      // Act
      const segments = estimateZoneProfile(text);

      // Assert
      expect(segments).toEqual(expected);
    }
  );
});

describe("estimateZoneProfile (step splitting)", () => {
  it.each(["15' Z1 - 20' Z3 - 10' Z1", "15' Z1 20' Z3 10' Z1"])(
    "should start a new step at every duration in %s",
    (text) => {
      // Arrange
      const expected = [seg(Z1, MIN_15), seg(Z3, MIN_20), seg(Z1, MIN_10)];

      // Act
      const segments = estimateZoneProfile(text);

      // Assert
      expect(segments).toEqual(expected);
    }
  );

  it.each(["4x(3' z4, 2' z1)", "4x(3' z4 / 2' z1)", "4x(3' z4 - 2' z1)"])(
    "should split the steps of %s inside the group",
    (text) => {
      // Arrange
      const expected = reps(FOUR_TIMES, seg(Z4, MIN_3), seg(Z1, MIN_2));

      // Act
      const segments = estimateZoneProfile(text);

      // Assert
      expect(segments).toEqual(expected);
    }
  );

  it("should not split a chunk at a comma between digits", () => {
    // Arrange
    const text = "10' z1,5' z2";

    // Act
    const segments = estimateZoneProfile(text);

    // Assert
    expect(segments).toEqual([seg(Z1, MIN_10), seg(Z2, MIN_5)]);
  });
});

describe("estimateZoneProfile (unbracketed repeats)", () => {
  it.each([
    ["4x5' z4, 2' z1", FOUR_TIMES, MIN_5, MIN_2],
    ["3x5' Z4 rec 2' Z1", THREE_TIMES, MIN_5, MIN_2],
    ['4x30" fuerte / 30" suave', FOUR_TIMES, SEC_30, SEC_30],
    ["4×3min Z4 + 2' Z1", FOUR_TIMES, MIN_3, MIN_2],
  ])("should alternate work and recovery for %s", (text, count, work, rest) => {
    // Arrange
    const expected = reps(count, seg(Z4, work), seg(Z1, rest));

    // Act
    const segments = estimateZoneProfile(text);

    // Assert
    expect(segments).toEqual(expected);
  });

  it.each([
    ["4x5' z4 + 15' suave", seg(Z1, MIN_15)],
    ["4x5' z4 + 5' cooldown", seg(Z1, MIN_5)],
  ])(
    "should not take %s's longer or cool-down step as recovery",
    (text, last) => {
      // Arrange
      const expected = [seg(Z4, FOUR_TIMES * MIN_5), last];

      // Act
      const segments = estimateZoneProfile(text);

      // Assert
      expect(segments).toEqual(expected);
    }
  );

  it.each([
    ["4x1' z5 + 1' z1", FOUR_TIMES, seg(Z5, MIN_1), seg(Z1, MIN_1)],
    ['10x30" z5 + 30" z1', TEN_TIMES, seg(Z5, SEC_30), seg(Z1, SEC_30)],
    ["8x1' fuerte + 1' suave", EIGHT_TIMES, seg(Z4, MIN_1), seg(Z1, MIN_1)],
    ["6x3' z4 + 3' trote", SIX_TIMES, seg(Z4, MIN_3), seg(Z1, MIN_3)],
    ["4x1' z5 con 1' z1", FOUR_TIMES, seg(Z5, MIN_1), seg(Z1, MIN_1)],
    ["3x10' z4 + 10' z2", THREE_TIMES, seg(Z4, MIN_10), seg(Z2, MIN_10)],
  ])(
    "should take the marked equal-length step in %s as recovery",
    (text, count, work, rest) => {
      // Arrange
      const expected = reps(count, work, rest);

      // Act
      const segments = estimateZoneProfile(text);

      // Assert
      expect(segments).toEqual(expected);
    }
  );

  it.each(["3x10' z2 + 10' z2", "4x5' + 5'", "10x1'/1' z5"])(
    "should return no estimate for the ambiguous equal-length pair in %s",
    (text) => {
      // Arrange
      const expected: Array<unknown> = [];

      // Act
      const segments = estimateZoneProfile(text);

      // Assert
      expect(segments).toEqual(expected);
    }
  );

  it("should keep a / pair whose zones sit on both halves", () => {
    // Arrange
    const text = "10x 1' z5 / 1' z1";

    // Act
    const segments = estimateZoneProfile(text);

    // Assert
    expect(segments).toEqual(reps(TEN_TIMES, seg(Z5, MIN_1), seg(Z1, MIN_1)));
  });

  it("should split at a repeat that does not start the step", () => {
    // Arrange
    const text = "20' z1 4x1' z4";

    // Act
    const segments = estimateZoneProfile(text);

    // Assert
    expect(segments).toEqual([seg(Z1, MIN_20), seg(Z4, MIN_4)]);
  });

  it("should put a recovery marked between only between the reps", () => {
    // Arrange
    const text = "2x5min hard with 3min recovery between";

    // Act
    const segments = estimateZoneProfile(text);

    // Assert
    expect(segments).toEqual([seg(Z4, MIN_5), seg(Z1, MIN_3), seg(Z4, MIN_5)]);
  });

  it("should repeat only the steps after then for a trailing x4", () => {
    // Arrange
    const text = "10' z1 then alternate 5min tempo and 1min recovery x4";

    // Act
    const segments = estimateZoneProfile(text);

    // Assert
    expect(segments).toEqual([
      seg(Z1, MIN_10),
      ...reps(FOUR_TIMES, seg(Z3, MIN_5), seg(Z1, MIN_1)),
    ]);
  });

  it("should repeat both steps of a chunk for a trailing x4 without then", () => {
    // Arrange
    const text = "5' z1, 3' z4 + 2' z1 x4";

    // Act
    const segments = estimateZoneProfile(text);

    // Assert
    expect(segments).toEqual([
      seg(Z1, MIN_5),
      ...reps(FOUR_TIMES, seg(Z4, MIN_3), seg(Z1, MIN_2)),
    ]);
  });

  it.each([
    "10' z1 then 1' z4 + 1' z1 + 1' z3 x4",
    "5' z1 + 3' z4 + 2' z1 x4",
    "5' z1 + 3' z4 + 2' z1 + 1' z3 x4",
  ])(
    "should return no estimate when the trailing x4 in %s would repeat three steps",
    (text) => {
      // Arrange
      const expected: Array<unknown> = [];

      // Act
      const segments = estimateZoneProfile(text);

      // Assert
      expect(segments).toEqual(expected);
    }
  );
});
