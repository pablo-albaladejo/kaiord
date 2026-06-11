import type { KRD } from "@kaiord/core";
import {
  buildKRD,
  buildKRDLap,
  buildKRDMetadata,
  buildKRDSession,
  buildWorkoutStep,
  createMockLogger,
} from "@kaiord/core/test-utils";
import { describe, expect, it } from "vitest";

import {
  FIT_TARGET_POWER_RANGE_HIGH,
  FIT_TARGET_POWER_RANGE_LOW,
} from "../../test-utils/constants";
import {
  createGarminFitSdkReader,
  createGarminFitSdkWriter,
} from "../garmin-fitsdk";
import { convertKRDToMessages } from "../krd-to-fit/krd-to-fit.converter";
import { convertFitToKrdLap, convertKrdToFitLap } from "../lap";
import { mapFitSessionToKrd } from "../session";
import { convertKrdToFitSession } from "../session/krd-to-fit-session.converter";
import { FIT_MESSAGE_NUMBERS } from "../shared/message-numbers";
import {
  FIT_TO_KRD_SPORT,
  KRD_TO_FIT_SPORT,
  mapSportToFit,
  mapSportToKrd,
} from "../sport/sport.mapper";
import type { FitTargetData } from "../target/target.converter";
import { convertFitTarget } from "../target/target.converter";

const buildWorkoutKrd = (sport: string): KRD =>
  buildKRD.build({
    version: "1.0",
    type: "structured_workout",
    metadata: buildKRDMetadata.build({ sport }),
    extensions: {
      structured_workout: {
        name: "Sport Round-Trip",
        sport,
        steps: [
          buildWorkoutStep.build({
            stepIndex: 0,
            durationType: "time",
            duration: { type: "time", seconds: 300 },
          }),
        ],
      },
    },
  });

describe("Round-trip: sport field (snake↔camel mapper)", () => {
  const sports = ["cross_country_skiing", "training", "rowing", "tennis"];

  it.each(sports)(
    "should preserve workout sport %s through FIT encode/decode",
    async (sport) => {
      // Arrange
      const logger = createMockLogger();
      const writer = createGarminFitSdkWriter(logger);
      const reader = createGarminFitSdkReader(logger);

      // Act
      const buffer = await writer(buildWorkoutKrd(sport));
      const decoded = await reader(buffer);

      // Assert
      expect(decoded.metadata.sport).toBe(sport);
    }
  );

  it("should preserve session sport through FIT message conversion", () => {
    // Arrange
    const session = buildKRDSession.build({ sport: "cross_country_skiing" });

    // Act
    const fitMessage = convertKrdToFitSession(session);
    const decoded = mapFitSessionToKrd(fitMessage as never);

    // Assert
    expect(fitMessage.sport).toBe("crossCountrySkiing");
    expect(decoded.sport).toBe("cross_country_skiing");
  });

  it("should preserve lap-level sport through FIT message conversion", () => {
    // Arrange
    const lap = buildKRDLap.build({ sport: "rowing" });

    // Act
    const fitMessage = convertKrdToFitLap(lap);
    const decoded = convertFitToKrdLap(fitMessage as Record<string, unknown>);

    // Assert
    expect(fitMessage.sport).toBe("rowing");
    expect(decoded.sport).toBe("rowing");
  });
});

describe("Round-trip: power range target (targetValue:0 sentinel)", () => {
  it("should preserve a power range through KRD encode then FIT decode", () => {
    // Arrange
    const logger = createMockLogger();
    const krd = buildKRD.build({
      version: "1.0",
      type: "structured_workout",
      metadata: buildKRDMetadata.build({ sport: "cycling" }),
      extensions: {
        structured_workout: {
          name: "Power Range Round-Trip",
          sport: "cycling",
          steps: [
            buildWorkoutStep.build({
              stepIndex: 0,
              durationType: "time",
              duration: { type: "time", seconds: 300 },
              targetType: "power",
              target: {
                type: "power",
                value: {
                  unit: "range",
                  min: FIT_TARGET_POWER_RANGE_LOW,
                  max: FIT_TARGET_POWER_RANGE_HIGH,
                },
              },
            }),
          ],
        },
      },
    });
    const messages = convertKRDToMessages(krd, logger);
    const stepMsg = messages.find(
      (msg: unknown) =>
        (msg as { mesgNum?: number }).mesgNum ===
          FIT_MESSAGE_NUMBERS.WORKOUT_STEP &&
        (msg as { messageIndex?: number }).messageIndex === 0
    ) as FitTargetData & { mesgNum: number };

    // Act
    const decodedTarget = convertFitTarget(stepMsg);

    // Assert
    expect(stepMsg.targetValue).toBe(0);
    expect(stepMsg.customTargetPowerLow).toBe(FIT_TARGET_POWER_RANGE_LOW);
    expect(stepMsg.customTargetPowerHigh).toBe(FIT_TARGET_POWER_RANGE_HIGH);
    expect(decodedTarget).toStrictEqual({
      type: "power",
      value: {
        unit: "range",
        min: FIT_TARGET_POWER_RANGE_LOW,
        max: FIT_TARGET_POWER_RANGE_HIGH,
      },
    });
  });
});

describe("sport mapper (camelCase ↔ snake_case)", () => {
  it("should map a multi-word FIT sport to snake_case KRD", () => {
    // Arrange
    const fitSport = "crossCountrySkiing";

    // Act
    const krdSport = mapSportToKrd(fitSport);

    // Assert
    expect(krdSport).toBe("cross_country_skiing");
  });

  it("should map a multi-word KRD sport to camelCase FIT", () => {
    // Arrange
    const krdSport = "cross_country_skiing";

    // Act
    const fitSport = mapSportToFit(krdSport);

    // Assert
    expect(fitSport).toBe("crossCountrySkiing");
  });

  it("should round-trip representative KRD sports unchanged", () => {
    // Arrange
    const samples = ["training", "rowing", "tennis", "cross_country_skiing"];

    // Act
    const roundTripped = samples.map((s) => mapSportToKrd(mapSportToFit(s)));

    // Assert
    expect(roundTripped).toEqual(samples);
  });

  it("should fall back to generic for invalid or undefined input both directions", () => {
    // Arrange
    const invalid = "not_a_sport";

    // Act
    const results = [
      mapSportToKrd(invalid),
      mapSportToFit(invalid),
      mapSportToKrd(undefined),
      mapSportToFit(undefined),
    ];

    // Assert
    expect(results).toEqual(["generic", "generic", "generic", "generic"]);
  });

  it("should invert the forward map losslessly (no KRD-value collisions)", () => {
    // Arrange
    const forwardKeys = Object.keys(FIT_TO_KRD_SPORT);
    const forwardValues = Object.values(FIT_TO_KRD_SPORT);

    // Act
    const reverseKeys = Object.keys(KRD_TO_FIT_SPORT);
    const uniqueKrdValues = new Set(forwardValues);

    // Assert
    expect(uniqueKrdValues.size).toBe(forwardKeys.length);
    expect(reverseKeys.length).toBe(forwardKeys.length);
  });
});
