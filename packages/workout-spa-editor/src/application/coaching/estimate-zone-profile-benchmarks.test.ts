import { describe, expect, it } from "vitest";

import { estimateZoneProfile } from "./estimate-zone-profile";
import {
  FOUR_TIMES,
  HOUR_3,
  MIN_1,
  MIN_2,
  MIN_3,
  MIN_4,
  MIN_5,
  MIN_7,
  MIN_10,
  MIN_12,
  MIN_13,
  MIN_15,
  MIN_20,
  MIN_25,
  reps,
  seg,
  THREE_TIMES,
  TWO_TIMES,
  Z1,
  Z2,
  Z3,
  Z4,
  Z5,
} from "./estimate-zone-profile.test-fixtures";

// Texts copied verbatim from packages/ai/src/evals/benchmarks.json (by id).
const BENCHMARK = {
  "es-train2go-contrasts":
    "Rodaje con contrastes: 10' z1 +30' contrastes\nRodaje 12' z1 RPE 2-3\n5' en Z2\n4x(30sg progresivos acabando fuerte + 60sg z1)\nR: 2'\nCambios con mucho contraste en terreno variable:\n30' con (30\" fuertes con cadencia alta pero con control de los apoyos y buenas sensaciones + 1' trote Z1 + 20\" cambio fuerte + 1'40\" Z1)\n5 min cool down",
  "es-cycling-progressive":
    "Rodillo 1h: 15' suave, 15' progresivo de Z2 a Z3, 3x(5' fuerte + 3' suave), R: 2', 10' vuelta a la calma",
  "es-running-progressive":
    "Rodaje 20' z1, 3x(1K progresivo + 2' trote), 10' muy cómodo",
  "cycling-sweetspot":
    "45min sweet spot cycling: 10min warmup, 3x10min at 88-93% FTP with 2min recovery, 5min cooldown",
  "cycling-mixed":
    "1h cycling: warmup 15min, then alternate 5min tempo and 3min recovery x4, cooldown 10min",
  "repetition-block":
    "Cycling: warmup 10min, then repeat 3 times: 5min hard, 2min easy, 1min sprint. Cooldown 10min.",
  "es-cycling":
    "Entreno de ciclismo de 1 hora: 15 minutos de calentamiento, 3x10 minutos en zona 4 con 5 minutos de recuperacion, 10 minutos de vuelta a la calma",
  "running-long":
    "Long run 90 minutes with the last 20 minutes at marathon pace",
  "cycling-vo2max":
    "4x4min VO2max intervals at 106-120% FTP with 4min recovery between, 15min warmup and 10min cooldown",
  "mixed-lang":
    "Cycling workout con 10 min warmup, luego 5x3min at 95% FTP con 2min recovery, y 10min cooldown",
  "zones-ftp":
    "Sweet spot intervals: 3x15min at 88-93% FTP with 5min easy between",
  "edge-long": "3 hour endurance cycling ride with fueling every 45 minutes",
  "running-tempo":
    "Tempo run: 15min warmup, 20min at threshold pace, 10min cooldown",
} as const;

describe("estimateZoneProfile (benchmarks.json coach texts)", () => {
  it.each([
    [
      "es-train2go-contrasts",
      "its 40' summary line is 24' off the 64' breakdown, past the 6' tolerance",
    ],
    [
      "es-cycling",
      "its 1h headline is 10' off the 70' breakdown, past the 9' tolerance",
    ],
    ["es-running-progressive", "its 1K reps have no width without a pace"],
    [
      "running-long",
      "the last 20 minutes sit inside the 90 at an unknown place",
    ],
  ] as const)("should return no estimate for %s because %s", (id) => {
    // Arrange
    const text = BENCHMARK[id];

    // Act
    const segments = estimateZoneProfile(text);

    // Assert
    expect(segments).toEqual([]);
  });

  it("should draw cycling-sweetspot because its 45min headline is within 15% of the 51' breakdown", () => {
    // Arrange
    const text = BENCHMARK["cycling-sweetspot"];

    // Act
    const segments = estimateZoneProfile(text);

    // Assert
    expect(segments).toEqual([
      seg(Z1, MIN_10),
      ...reps(TWO_TIMES, seg(null, MIN_10), seg(Z1, MIN_2)),
      seg(null, MIN_10),
      seg(Z1, MIN_7),
    ]);
  });

  it("should draw cycling-mixed because its 1h headline is within 5' of the 57' breakdown", () => {
    // Arrange
    const text = BENCHMARK["cycling-mixed"];

    // Act
    const segments = estimateZoneProfile(text);

    // Assert
    expect(segments).toEqual([
      seg(Z1, MIN_15),
      ...reps(THREE_TIMES, seg(Z3, MIN_5), seg(Z1, MIN_3)),
      seg(Z3, MIN_5),
      seg(Z1, MIN_13),
    ]);
  });

  it("should draw es-cycling-progressive because its 1h headline is within 15% of the 68' breakdown", () => {
    // Arrange
    const text = BENCHMARK["es-cycling-progressive"];

    // Act
    const segments = estimateZoneProfile(text);

    // Assert
    expect(segments).toEqual([
      seg(Z1, MIN_15),
      seg(null, MIN_15),
      ...reps(TWO_TIMES, seg(Z4, MIN_5), seg(Z1, MIN_5)),
      seg(Z4, MIN_5),
      seg(Z1, MIN_13),
    ]);
  });

  it("should expand repetition-block's repeat 3 times: block", () => {
    // Arrange
    const text = BENCHMARK["repetition-block"];
    const rep = [seg(Z4, MIN_5), seg(Z1, MIN_2), seg(Z5, MIN_1)];

    // Act
    const segments = estimateZoneProfile(text);

    // Assert
    expect(segments).toEqual([
      seg(Z1, MIN_10),
      ...reps(THREE_TIMES, ...rep),
      seg(Z1, MIN_10),
    ]);
  });

  it("should leave cycling-vo2max's %FTP reps unzoned with recovery only between them", () => {
    // Arrange
    const text = BENCHMARK["cycling-vo2max"];

    // Act
    const segments = estimateZoneProfile(text);

    // Assert
    expect(segments).toEqual([
      ...reps(THREE_TIMES, seg(null, MIN_4), seg(Z1, MIN_4)),
      seg(null, MIN_4),
      seg(Z1, MIN_25),
    ]);
  });

  it("should not count edge-long's fuelling frequency as a segment", () => {
    // Arrange
    const text = BENCHMARK["edge-long"];

    // Act
    const segments = estimateZoneProfile(text);

    // Assert
    expect(segments).toEqual([seg(Z2, HOUR_3)]);
  });

  it("should keep running-tempo's labelled title and draw its threshold block", () => {
    // Arrange
    const text = BENCHMARK["running-tempo"];

    // Act
    const segments = estimateZoneProfile(text);

    // Assert
    expect(segments).toEqual([
      seg(Z1, MIN_15),
      seg(Z4, MIN_20),
      seg(Z1, MIN_10),
    ]);
  });

  it("should alternate mixed-lang's unzoned %FTP reps with their con recovery", () => {
    // Arrange
    const text = BENCHMARK["mixed-lang"];

    // Act
    const segments = estimateZoneProfile(text);

    // Assert
    expect(segments).toEqual([
      seg(Z1, MIN_10),
      ...reps(FOUR_TIMES, seg(null, MIN_3), seg(Z1, MIN_2)),
      seg(null, MIN_3),
      seg(Z1, MIN_12),
    ]);
  });

  it("should drop zones-ftp's untimed title words and rest only between reps", () => {
    // Arrange
    const text = BENCHMARK["zones-ftp"];

    // Act
    const segments = estimateZoneProfile(text);

    // Assert
    expect(segments).toEqual([
      ...reps(TWO_TIMES, seg(null, MIN_15), seg(Z1, MIN_5)),
      seg(null, MIN_15),
    ]);
  });
});
