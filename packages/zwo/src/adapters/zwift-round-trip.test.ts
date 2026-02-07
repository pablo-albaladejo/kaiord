import { XMLParser } from "fast-xml-parser";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { buildKRD } from "@kaiord/core/test-utils";
import { buildWorkoutStep } from "@kaiord/core/test-utils";
import { createMockLogger } from "@kaiord/core/test-utils";
import { convertKRDToZwift } from "./krd-to-zwift.converter";
import { convertZwiftToKRD } from "./zwift-to-krd.converter";

describe("Zwift Round-Trip Conversion", () => {
  const logger = createMockLogger();
  const fixturesDir = join(__dirname, "../../tests/fixtures/zwift-files");

  const parseZwiftXml = (xmlString: string): unknown => {
    const parser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: "@_",
      parseAttributeValue: true,
    });
    return parser.parse(xmlString);
  };

  describe("ZWO → KRD → ZWO", () => {
    it("should preserve metadata when converting ZWO → KRD → ZWO", async () => {
      // Arrange
      const originalZwoPath = join(fixturesDir, "WorkoutIndividualSteps.zwo");
      const originalZwoXml = readFileSync(originalZwoPath, "utf-8");
      const originalZwoData = parseZwiftXml(originalZwoXml);

      // Act
      const krd = convertZwiftToKRD(originalZwoData, logger);
      const regeneratedZwoXml = convertKRDToZwift(krd, logger);
      const regeneratedZwoData = parseZwiftXml(regeneratedZwoXml);

      // Assert
      const original = originalZwoData.workout_file;
      const regenerated = regeneratedZwoData.workout_file;

      expect(regenerated.name).toBe(original.name);
      expect(regenerated.sportType).toBe(original.sportType);
      expect(regenerated["@_kaiord:timeCreated"]).toBe(
        original["@_kaiord:timeCreated"]
      );
      expect(regenerated["@_kaiord:manufacturer"]).toBe(
        original["@_kaiord:manufacturer"]
      );
      expect(regenerated["@_kaiord:product"]).toBe(
        original["@_kaiord:product"]
      );
      expect(regenerated["@_kaiord:serialNumber"]).toBe(
        original["@_kaiord:serialNumber"]
      );
    });

    it("should preserve power zones in ZWO → KRD → ZWO", async () => {
      // Arrange
      const originalZwoPath = join(fixturesDir, "WorkoutIndividualSteps.zwo");
      const originalZwoXml = readFileSync(originalZwoPath, "utf-8");
      const originalZwoData = parseZwiftXml(originalZwoXml);

      // Act
      const krd = convertZwiftToKRD(originalZwoData, logger);
      const regeneratedZwoXml = convertKRDToZwift(krd, logger);
      const regeneratedZwoData = parseZwiftXml(regeneratedZwoXml);

      // Assert
      const originalWorkout = originalZwoData.workout_file.workout;
      const regeneratedWorkout = regeneratedZwoData.workout_file.workout;

      const originalSteps = originalWorkout.SteadyState;
      const regeneratedSteps = regeneratedWorkout.SteadyState;

      expect(Array.isArray(regeneratedSteps)).toBe(
        Array.isArray(originalSteps)
      );

      if (Array.isArray(originalSteps) && Array.isArray(regeneratedSteps)) {
        for (let i = 0; i < originalSteps.length; i++) {
          const original = originalSteps[i];
          const regenerated = regeneratedSteps[i];

          if (original["@_kaiord:powerUnit"] === "zone") {
            expect(regenerated["@_kaiord:powerUnit"]).toBe("zone");
            expect(regenerated["@_kaiord:powerZone"]).toBe(
              original["@_kaiord:powerZone"]
            );
          }
        }
      }
    });

    it("should preserve watts in ZWO → KRD → ZWO", async () => {
      // Arrange
      const originalZwoPath = join(
        fixturesDir,
        "WorkoutCustomTargetValues.zwo"
      );
      const originalZwoXml = readFileSync(originalZwoPath, "utf-8");
      const originalZwoData = parseZwiftXml(originalZwoXml);

      // Act
      const krd = convertZwiftToKRD(originalZwoData, logger);
      const regeneratedZwoXml = convertKRDToZwift(krd, logger);
      const regeneratedZwoData = parseZwiftXml(regeneratedZwoXml);

      // Assert
      const originalWorkout = originalZwoData.workout_file.workout;
      const regeneratedWorkout = regeneratedZwoData.workout_file.workout;

      const originalRamps = originalWorkout.Ramp;
      const regeneratedRamps = regeneratedWorkout.Ramp;

      expect(Array.isArray(regeneratedRamps)).toBe(
        Array.isArray(originalRamps)
      );

      if (Array.isArray(originalRamps) && Array.isArray(regeneratedRamps)) {
        for (let i = 0; i < originalRamps.length; i++) {
          const original = originalRamps[i];
          const regenerated = regeneratedRamps[i];

          if (original["@_kaiord:powerUnit"] === "watts") {
            expect(regenerated["@_kaiord:powerUnit"]).toBe("watts");
            expect(regenerated["@_kaiord:originalWattsLow"]).toBe(
              original["@_kaiord:originalWattsLow"]
            );
            expect(regenerated["@_kaiord:originalWattsHigh"]).toBe(
              original["@_kaiord:originalWattsHigh"]
            );
          }
        }
      }
    });
  });

  describe("KRD → ZWO → KRD", () => {
    it("should preserve metadata when converting KRD → ZWO → KRD", async () => {
      // Arrange
      const originalKrd = buildKRD.build({
        metadata: {
          created: "2009-09-09T20:38:00.000Z",
          sport: "cycling",
          manufacturer: "dynastream",
          product: "hrmFitSingleByteProductId",
          serialNumber: "1234",
        },
        extensions: {
          workout: {
            name: "Test Workout",
            sport: "cycling",
            steps: [
              buildWorkoutStep.build({
                stepIndex: 0,
                durationType: "time",
                duration: { type: "time", seconds: 300 },
                targetType: "power",
                target: {
                  type: "power",
                  value: { unit: "zone", value: 2 },
                },
                intensity: "warmup",
              }),
            ],
          },
          fit: {
            type: "workout",
            hrm_fit_single_byte_product_id: 12,
          },
        },
      });

      // Act
      const zwoXml = convertKRDToZwift(originalKrd, logger);
      const zwoData = parseZwiftXml(zwoXml);
      const regeneratedKrd = convertZwiftToKRD(zwoData, logger);

      // Assert
      expect(regeneratedKrd.metadata.created).toBe(
        originalKrd.metadata.created
      );
      expect(regeneratedKrd.metadata.sport).toBe(originalKrd.metadata.sport);
      expect(regeneratedKrd.metadata.manufacturer).toBe(
        originalKrd.metadata.manufacturer
      );
      expect(regeneratedKrd.metadata.product).toBe(
        originalKrd.metadata.product
      );
      // serialNumber may be parsed as number by XML parser
      expect(String(regeneratedKrd.metadata.serialNumber)).toBe(
        String(originalKrd.metadata.serialNumber)
      );

      const originalFit = originalKrd.extensions?.fit as Record<
        string,
        unknown
      >;
      const regeneratedFit = regeneratedKrd.extensions?.fit as Record<
        string,
        unknown
      >;
      expect(regeneratedFit?.type).toBe(originalFit?.type);
      expect(regeneratedFit?.hrm_fit_single_byte_product_id).toBe(
        originalFit?.hrm_fit_single_byte_product_id
      );
    });

    it("should preserve power zones in KRD → ZWO → KRD", async () => {
      // Arrange
      const originalKrd = buildKRD.build({
        extensions: {
          workout: {
            name: "Power Zone Test",
            sport: "cycling",
            steps: [
              buildWorkoutStep.build({
                stepIndex: 0,
                durationType: "time",
                duration: { type: "time", seconds: 600 },
                targetType: "power",
                target: {
                  type: "power",
                  value: { unit: "zone", value: 5 },
                },
                intensity: "active",
              }),
            ],
          },
        },
      });

      // Act
      const zwoXml = convertKRDToZwift(originalKrd, logger);
      const zwoData = parseZwiftXml(zwoXml);
      const regeneratedKrd = convertZwiftToKRD(zwoData, logger);

      // Assert
      const originalStep = (
        originalKrd.extensions?.workout as { steps: Array<unknown> }
      ).steps[0] as {
        target: { type: string; value: { unit: string; value: number } };
      };
      const regeneratedStep = (
        regeneratedKrd.extensions?.workout as { steps: Array<unknown> }
      ).steps[0] as {
        target: { type: string; value: { unit: string; value: number } };
      };

      expect(regeneratedStep.target.type).toBe("power");
      expect(regeneratedStep.target.value.unit).toBe("zone");
      expect(regeneratedStep.target.value.value).toBe(
        originalStep.target.value.value
      );
    });

    it("should preserve watts in KRD → ZWO → KRD", async () => {
      // Arrange
      const originalKrd = buildKRD.build({
        extensions: {
          workout: {
            name: "Watts Test",
            sport: "cycling",
            steps: [
              buildWorkoutStep.build({
                stepIndex: 0,
                durationType: "time",
                duration: { type: "time", seconds: 600 },
                targetType: "power",
                target: {
                  type: "power",
                  value: { unit: "watts", value: 275 },
                },
                intensity: "active",
              }),
            ],
          },
        },
      });

      // Act
      const zwoXml = convertKRDToZwift(originalKrd, logger);
      const zwoData = parseZwiftXml(zwoXml);
      const regeneratedKrd = convertZwiftToKRD(zwoData, logger);

      // Assert
      const originalStep = (
        originalKrd.extensions?.workout as { steps: Array<unknown> }
      ).steps[0] as {
        target: { type: string; value: { unit: string; value: number } };
      };
      const regeneratedStep = (
        regeneratedKrd.extensions?.workout as { steps: Array<unknown> }
      ).steps[0] as {
        target: { type: string; value: { unit: string; value: number } };
      };

      expect(regeneratedStep.target.type).toBe("power");
      expect(regeneratedStep.target.value.unit).toBe("watts");
      expect(regeneratedStep.target.value.value).toBe(
        originalStep.target.value.value
      );
    });

    it("should preserve distance durations in KRD → ZWO → KRD", async () => {
      // Arrange
      const originalKrd = buildKRD.build({
        extensions: {
          workout: {
            name: "Distance Test",
            sport: "cycling",
            steps: [
              buildWorkoutStep.build({
                stepIndex: 0,
                durationType: "distance",
                duration: { type: "distance", meters: 5000 },
                targetType: "power",
                target: {
                  type: "power",
                  value: { unit: "zone", value: 3 },
                },
                intensity: "active",
              }),
            ],
          },
        },
      });

      // Act
      const zwoXml = convertKRDToZwift(originalKrd, logger);
      const zwoData = parseZwiftXml(zwoXml);
      const regeneratedKrd = convertZwiftToKRD(zwoData, logger);

      // Assert
      const originalStep = (
        originalKrd.extensions?.workout as { steps: Array<unknown> }
      ).steps[0] as { duration: { type: string; meters: number } };
      const regeneratedStep = (
        regeneratedKrd.extensions?.workout as { steps: Array<unknown> }
      ).steps[0] as { duration: { type: string; meters: number } };

      expect(regeneratedStep.duration.type).toBe("distance");
      expect(regeneratedStep.duration.meters).toBe(
        originalStep.duration.meters
      );
    });

    it("should preserve heart rate targets in KRD → ZWO → KRD", async () => {
      // Arrange
      const originalKrd = buildKRD.build({
        extensions: {
          workout: {
            name: "HR Test",
            sport: "cycling",
            steps: [
              buildWorkoutStep.build({
                stepIndex: 0,
                durationType: "time",
                duration: { type: "time", seconds: 600 },
                targetType: "heart_rate",
                target: {
                  type: "heart_rate",
                  value: { unit: "zone", value: 3 },
                },
                intensity: "active",
              }),
            ],
          },
        },
      });

      // Act
      const zwoXml = convertKRDToZwift(originalKrd, logger);
      const zwoData = parseZwiftXml(zwoXml);
      const regeneratedKrd = convertZwiftToKRD(zwoData, logger);

      // Assert
      const originalStep = (
        originalKrd.extensions?.workout as { steps: Array<unknown> }
      ).steps[0] as {
        target: { type: string; value: { unit: string; value: number } };
      };
      const regeneratedStep = (
        regeneratedKrd.extensions?.workout as { steps: Array<unknown> }
      ).steps[0] as {
        target: { type: string; value: { unit: string; value: number } };
      };

      expect(regeneratedStep.target.type).toBe("heart_rate");
      expect(regeneratedStep.target.value.unit).toBe("zone");
      expect(regeneratedStep.target.value.value).toBe(
        originalStep.target.value.value
      );
    });
  });
});
