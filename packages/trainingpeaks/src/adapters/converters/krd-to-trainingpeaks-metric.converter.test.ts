import type { KRD } from "@kaiord/core";
import { krdSchema } from "@kaiord/core";
import { describe, expect, it } from "vitest";

import {
  krdWeightToTrainingPeaksMetric,
  TRAININGPEAKS_WEIGHT_UNITS,
} from "./krd-to-trainingpeaks-metric.converter";

const HEALTH_VERSION = "2.0";
const KRD_VERSION = "2.0";
const ATHLETE_ID = 900123;
const WEIGHT_KG = 80.5;
const MEASURED_AT = "2026-07-01T07:30:00.000Z";
const WEIGHT_METRIC_TYPE = 9;

const buildWeightKrd = (): KRD =>
  krdSchema.parse({
    version: KRD_VERSION,
    type: "weight_measurement",
    metadata: { created: MEASURED_AT, manufacturer: "trainingpeaks" },
    extensions: {
      health: {
        weight: {
          kind: "weight",
          version: HEALTH_VERSION,
          measuredAt: MEASURED_AT,
          weightKilograms: WEIGHT_KG,
        },
      },
    },
  });

const buildBodyCompositionOnlyKrd = (): KRD =>
  krdSchema.parse({
    version: KRD_VERSION,
    type: "body_composition",
    metadata: { created: MEASURED_AT, manufacturer: "trainingpeaks" },
    extensions: {
      health: {
        bodyComposition: {
          kind: "bodyComposition",
          version: HEALTH_VERSION,
          measuredAt: MEASURED_AT,
          bodyFatPercent: 18,
        },
      },
    },
  });

describe("krdWeightToTrainingPeaksMetric", () => {
  it("should build a consolidatedtimedmetric carrying a single weight detail", () => {
    // Arrange
    const krd = buildWeightKrd();

    // Act
    const metric = krdWeightToTrainingPeaksMetric(krd, ATHLETE_ID);

    // Assert
    expect(metric).toEqual({
      athleteId: ATHLETE_ID,
      timeStamp: MEASURED_AT,
      id: null,
      details: [
        {
          type: WEIGHT_METRIC_TYPE,
          label: "Weight",
          value: WEIGHT_KG,
          time: MEASURED_AT,
          units: TRAININGPEAKS_WEIGHT_UNITS,
          formatedUnits: TRAININGPEAKS_WEIGHT_UNITS,
        },
      ],
    });
  });

  it("should send the weight value in kilograms unconverted", () => {
    // Arrange
    const krd = buildWeightKrd();

    // Act
    const metric = krdWeightToTrainingPeaksMetric(krd, ATHLETE_ID);

    // Assert
    expect(metric?.details[0]?.value).toBe(WEIGHT_KG);
    expect(metric?.details[0]?.units).toBe("kg");
  });

  it("should return undefined when the KRD carries no weight", () => {
    // Arrange
    const krd = buildBodyCompositionOnlyKrd();

    // Act
    const metric = krdWeightToTrainingPeaksMetric(krd, ATHLETE_ID);

    // Assert
    expect(metric).toBeUndefined();
  });
});
