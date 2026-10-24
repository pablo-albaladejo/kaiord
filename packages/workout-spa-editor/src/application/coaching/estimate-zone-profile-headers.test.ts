import { describe, expect, it } from "vitest";

import { estimateZoneProfile } from "./estimate-zone-profile";
import {
  HOUR_1,
  MIN_2,
  MIN_5,
  MIN_10,
  MIN_12,
  MIN_15,
  MIN_20,
  MIN_30,
  MIN_35,
  MIN_40,
  MIN_45,
  MIN_51,
  MIN_61,
  MIN_66,
  MIN_69,
  reps,
  seg,
  THREE_TIMES,
  total,
  TWO_TIMES,
  Z1,
  Z2,
  Z3,
  Z4,
} from "./estimate-zone-profile.test-fixtures";

describe("estimateZoneProfile (headers and totals)", () => {
  it.each([
    ["Rodillo 30': 10' z1, 20' z2", "a headline total that reconciles"],
    [
      "Rodaje: 10' z1 + 20' z2\n10' z1\n20' z2",
      "a summary line that reconciles",
    ],
    ["10' z1\n20' z2\nTotal: 30'", "a total line that reconciles"],
    ["10' z1 + 20' z2, total 30'", "a total chunk that reconciles"],
    ["Total 30': 10' z1, 20' z2", "a total title followed by its steps"],
  ])("should drop %s as %s", (text) => {
    // Arrange
    const expected = [seg(Z1, MIN_10), seg(Z2, MIN_20)];

    // Act
    const segments = estimateZoneProfile(text);

    // Assert
    expect(segments).toEqual(expected);
  });

  it.each([
    ["Rodillo 1h: 15' suave, 5' z2", "a 1h headline over 20'"],
    ["Rodillo 1h: 15' suave\n5' z2", "a 1h headline over 20' on two lines"],
    [
      "Rodaje con contrastes: 10' z1 + 30' contrastes\n5' z2\n10' z1",
      "a 40' summary over 15'",
    ],
    ["10' z1\n20' z2\nen total 40'", "a 40' total over 30'"],
  ])(
    "should return no estimate for %s because %s is past the max(5', 15%) tolerance",
    (text) => {
      // Arrange
      const expected: Array<unknown> = [];

      // Act
      const segments = estimateZoneProfile(text);

      // Assert
      expect(segments).toEqual(expected);
    }
  );

  it.each([
    ["Rodillo 1h: 20' z1, 49' z2", MIN_69],
    ["Rodillo 30': 10' z1, 25' z2", MIN_35],
  ])(
    "should draw %s because its stated total is within the tolerance",
    (text, seconds) => {
      // Arrange
      const tolerated = seconds;

      // Act
      const segments = estimateZoneProfile(text);

      // Assert
      expect(total(segments)).toBe(tolerated);
    }
  );

  it.each(["Rodillo 1h: 20' z1, 50' z2", "Rodillo 30': 10' z1, 26' z2"])(
    "should return no estimate for %s just past the tolerance",
    (text) => {
      // Arrange
      const expected: Array<unknown> = [];

      // Act
      const segments = estimateZoneProfile(text);

      // Assert
      expect(segments).toEqual(expected);
    }
  );

  it.each([
    "60' en total\n10' z1\n40' z2\n10' z1",
    "Total 1h: 15' z1, 30' z2, 15' z1",
    "10' z1, 40' z2, 10' z1. En total 60'",
  ])("should read the stated total in %s and never draw it", (text) => {
    // Arrange
    const expected = HOUR_1;

    // Act
    const segments = estimateZoneProfile(text);

    // Assert
    expect(total(segments)).toBe(expected);
  });

  it("should return no estimate for a total chunk naming two durations", () => {
    // Arrange
    const text = "10' z1 + 20' z2 total 30'";

    // Act
    const segments = estimateZoneProfile(text);

    // Assert
    expect(segments).toEqual([]);
  });

  it("should drop an intensity-titled first line that summarises the rest", () => {
    // Arrange
    const text = "Rodaje suave: 10' z1 + 30' z2\n10' z1\n30' z2";

    // Act
    const segments = estimateZoneProfile(text);

    // Assert
    expect(segments).toEqual([seg(Z1, MIN_10), seg(Z2, MIN_30)]);
  });

  it("should drop a first line that restates a later line as the main set", () => {
    // Arrange
    const text =
      "Series umbral: 3x10' z4 + 2' z1\n15' z1\n3x10' z4 + 2' z1\n10' z1";

    // Act
    const segments = estimateZoneProfile(text);

    // Assert
    expect(segments).toEqual([
      seg(Z1, MIN_15),
      ...reps(TWO_TIMES, seg(Z4, MIN_10), seg(Z1, MIN_2)),
      seg(Z4, MIN_10),
      seg(Z1, MIN_12),
    ]);
  });

  it.each([
    [
      "Calentamiento: 10' z1\n4x(3' z4 + 2' z1)\nVuelta a la calma: 10' z1",
      MIN_40,
    ],
    [
      "Calentamiento: 10' z1\nPrincipal: 20' z3\nVuelta a la calma: 10' z1",
      MIN_40,
    ],
    [
      "Calentamiento: 15' suave\n3x10' z4 + 2' z1\nVuelta a la calma: 15' suave",
      MIN_66,
    ],
  ])(
    "should keep a warm-up line in %s even when the cool-down repeats it",
    (text, seconds) => {
      // Arrange
      const expected = seconds;

      // Act
      const segments = estimateZoneProfile(text);

      // Assert
      expect(total(segments)).toBe(expected);
    }
  );

  it.each([
    "Principal",
    "Series",
    "Series umbral",
    "Rodaje con series",
    "Umbral",
  ])(
    "should drop a %s: first line that restates a later bracketed repeat",
    (title) => {
      // Arrange
      const text = `${title}: 3x(10' z4 + 2' z1)\n15' z1\n3x(10' z4 + 2' z1)\n10' z1`;

      // Act
      const segments = estimateZoneProfile(text);

      // Assert
      expect(total(segments)).toBe(MIN_61);
    }
  );

  it.each([
    [
      "Series umbral: 4x(3' z4 + 2' z1)\nCalentamiento: 15' z1\nPrincipal: 4x(3' z4 + 2' z1)\nVuelta a la calma: 10' z1",
      MIN_45,
    ],
    [
      "Principal: 3x(10' z4 + 2' z1)\nCalentamiento: 15' z1\nPrincipal: 3x(10' z4 + 2' z1)",
      MIN_51,
    ],
  ])("should count the bracketed main set in %s once", (text, seconds) => {
    // Arrange
    const expected = seconds;

    // Act
    const segments = estimateZoneProfile(text);

    // Assert
    expect(total(segments)).toBe(expected);
  });

  it("should reconcile a summary that restates a line without a repeat", () => {
    // Arrange
    const text = "Rodaje: 10' z1\n20' z2\n10' z1";

    // Act
    const segments = estimateZoneProfile(text);

    // Assert
    expect(segments).toEqual([]);
  });

  it("should treat a labelled section line as a step, never a summary", () => {
    // Arrange
    const text = "Calentamiento: 15' suave\nPrincipal: 20' z3";

    // Act
    const segments = estimateZoneProfile(text);

    // Assert
    expect(segments).toEqual([seg(Z1, MIN_15), seg(Z3, MIN_20)]);
  });

  it("should ignore a duration given as a frequency", () => {
    // Arrange
    const text = "1 hora z2 con un gel cada 30 minutos";

    // Act
    const segments = estimateZoneProfile(text);

    // Assert
    expect(segments).toEqual([seg(Z2, HOUR_1)]);
  });

  it("should expand a repeat N times: block up to the end of its sentence", () => {
    // Arrange
    const text =
      "warmup 10min, then repeat 3 times: 5min hard, 2min easy. Cooldown 10min.";

    // Act
    const segments = estimateZoneProfile(text);

    // Assert
    expect(segments).toEqual([
      seg(Z1, MIN_10),
      ...reps(TWO_TIMES, seg(Z4, MIN_5), seg(Z1, MIN_2)),
      seg(Z4, MIN_5),
      seg(Z1, MIN_12),
    ]);
  });
});

describe("estimateZoneProfile (nested sub-steps)", () => {
  it.each([
    "Z2 60' including 3x5' z4",
    "Long run 90 minutes with the last 20 minutes at marathon pace",
    "10' z1 con 5' z2",
    "40' z2 de los cuales 10' z3",
  ])(
    "should return no estimate for %s because the sub-step's place is unknown",
    (text) => {
      // Arrange
      const expected: Array<unknown> = [];

      // Act
      const segments = estimateZoneProfile(text);

      // Assert
      expect(segments).toEqual(expected);
    }
  );

  it("should draw a span whose bracketed detail mixes zones as a gap", () => {
    // Arrange
    const text = "10' z1, 30' con (1' z4 + 1' z1)";

    // Act
    const segments = estimateZoneProfile(text);

    // Assert
    expect(segments).toEqual([seg(Z1, MIN_10), seg(null, MIN_30)]);
  });

  it("should keep a repeat's con recovery as recovery", () => {
    // Arrange
    const text = "3x10 minutos en zona 4 con 5 minutos de recuperacion";

    // Act
    const segments = estimateZoneProfile(text);

    // Assert
    expect(segments).toEqual(
      reps(THREE_TIMES, seg(Z4, MIN_10), seg(Z1, MIN_5))
    );
  });
});
