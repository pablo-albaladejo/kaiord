import { krdSchema } from "@kaiord/core";
import { describe, expect, it } from "vitest";

import { TRAININGPEAKS_METRICS_FIXTURE } from "../../test-utils/trainingpeaks-fixture";
import { trainingPeaksMetricsToKrd } from "./trainingpeaks-metrics-to-krd.converter";

const HEALTH_VERSION = "2.0";
const EXPECTED_DOCUMENT_COUNT = 2;

const FIRST_MEASURED_AT = "2026-07-01T07:30:00Z";
const FIRST_WEIGHT_KG = 80.5;
const SECOND_MEASURED_AT = "2026-07-02T07:45:00Z";
const WEIGHT_METRIC_TYPE = 9;
const STEPS_METRIC_TYPE = 58;
const STEPS_VALUE = 9000;

const EXPECTED_FIRST_WEIGHT = {
  kind: "weight",
  version: HEALTH_VERSION,
  measuredAt: FIRST_MEASURED_AT,
  weightKilograms: FIRST_WEIGHT_KG,
};

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
    const response = TRAININGPEAKS_METRICS_FIXTURE;

    // Act
    const [document] = trainingPeaksMetricsToKrd(response);

    // Assert
    expect(document?.type).toBe("weight_measurement");
    expect(document?.metadata.manufacturer).toBe("trainingpeaks");
    expect(document?.extensions?.health?.weight).toEqual(EXPECTED_FIRST_WEIGHT);
  });

  it.each([
    {
      scenario: "a naive timestamp anchored to UTC",
      index: 0,
      expected: FIRST_MEASURED_AT,
    },
    {
      scenario: "a zoned timestamp passed through unchanged",
      index: 1,
      expected: SECOND_MEASURED_AT,
    },
  ])("should emit $scenario", ({ index, expected }) => {
    // Arrange
    const response = TRAININGPEAKS_METRICS_FIXTURE;

    // Act
    const documents = trainingPeaksMetricsToKrd(response);

    // Assert
    expect(documents[index]?.extensions?.health?.weight?.measuredAt).toBe(
      expected
    );
  });

  it.each([
    {
      scenario: "entries whose channels carry no weight reading",
      entries: [
        {
          timeStamp: "2026-07-03T07:15:00",
          details: [{ type: STEPS_METRIC_TYPE, value: STEPS_VALUE }],
        },
      ],
    },
    {
      scenario: "a weight channel whose value is null",
      entries: [
        {
          timeStamp: "2026-07-04T07:10:00",
          details: [{ type: WEIGHT_METRIC_TYPE, value: null }],
        },
      ],
    },
  ])("should skip $scenario", ({ entries }) => {
    // Arrange

    // Act
    const result = trainingPeaksMetricsToKrd(entries);

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
    const response = TRAININGPEAKS_METRICS_FIXTURE;

    // Act
    const allValid = trainingPeaksMetricsToKrd(response).every(
      (document) => krdSchema.safeParse(document).success
    );

    // Assert
    expect(allValid).toBe(true);
  });
});
