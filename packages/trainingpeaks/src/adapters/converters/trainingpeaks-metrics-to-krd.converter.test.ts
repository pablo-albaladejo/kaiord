import { krdSchema } from "@kaiord/core";
import { describe, expect, it } from "vitest";

import { TRAININGPEAKS_METRICS_FIXTURE } from "../../test-utils/trainingpeaks-fixture";
import { trainingPeaksMetricsToKrd } from "./trainingpeaks-metrics-to-krd.converter";

const HEALTH_VERSION = "2.0";
const EXPECTED_DOCUMENT_COUNT = 2;

const FIRST_MEASURED_AT = "2026-07-01T07:30:00Z";
const FIRST_WEIGHT_KG = 80.5;
const SECOND_MEASURED_AT = "2026-07-02T07:45:00Z";
const SECOND_WEIGHT_KG = 80.1;

const EXPECTED_FIRST_WEIGHT = {
  kind: "weight",
  version: HEALTH_VERSION,
  measuredAt: FIRST_MEASURED_AT,
  weightKilograms: FIRST_WEIGHT_KG,
};

const documents = trainingPeaksMetricsToKrd(TRAININGPEAKS_METRICS_FIXTURE);
const [first, second] = documents;

describe("trainingPeaksMetricsToKrd", () => {
  it("should emit one KRD document per entry that carries a weight reading", () => {
    // Arrange
    const response = TRAININGPEAKS_METRICS_FIXTURE;

    // Act
    const result = trainingPeaksMetricsToKrd(response);

    // Assert
    expect(result).toHaveLength(EXPECTED_DOCUMENT_COUNT);
  });

  it("should map a weight detail to a KRD weight_measurement document", () => {
    // Arrange
    const document = first;

    // Act
    const health = document?.extensions?.health;

    // Assert
    expect(document?.type).toBe("weight_measurement");
    expect(document?.metadata.manufacturer).toBe("trainingpeaks");
    expect(health?.weight).toEqual(EXPECTED_FIRST_WEIGHT);
  });

  it("should anchor a naive timestamp to a UTC ISO instant", () => {
    // Arrange
    const document = first;

    // Act
    const measuredAt = document?.extensions?.health?.weight?.measuredAt;

    // Assert
    expect(measuredAt).toBe(FIRST_MEASURED_AT);
  });

  it("should pass a zoned timestamp through unchanged", () => {
    // Arrange
    const document = second;

    // Act
    const measuredAt = document?.extensions?.health?.weight?.measuredAt;

    // Assert
    expect(measuredAt).toBe(SECOND_MEASURED_AT);
    expect(document?.extensions?.health?.weight?.weightKilograms).toBe(
      SECOND_WEIGHT_KG
    );
  });

  it("should skip entries whose channels carry no weight reading", () => {
    // Arrange
    const stepsOnly = [
      {
        timeStamp: "2026-07-03T07:15:00",
        details: [{ type: 58, value: 9000 }],
      },
    ];

    // Act
    const result = trainingPeaksMetricsToKrd(stepsOnly);

    // Assert
    expect(result).toEqual([]);
  });

  it("should skip a weight channel whose value is null", () => {
    // Arrange
    const nullWeight = [
      {
        timeStamp: "2026-07-04T07:10:00",
        details: [{ type: 9, value: null }],
      },
    ];

    // Act
    const result = trainingPeaksMetricsToKrd(nullWeight);

    // Assert
    expect(result).toEqual([]);
  });

  it("should return an empty array for a malformed response", () => {
    // Arrange
    const malformed = { not: "an array" };

    // Act
    const result = trainingPeaksMetricsToKrd(malformed);

    // Assert
    expect(result).toEqual([]);
  });

  it("should produce documents that validate against the KRD schema", () => {
    // Arrange
    const candidates = documents;

    // Act
    const allValid = candidates.every(
      (document) => krdSchema.safeParse(document).success
    );

    // Assert
    expect(allValid).toBe(true);
  });
});
