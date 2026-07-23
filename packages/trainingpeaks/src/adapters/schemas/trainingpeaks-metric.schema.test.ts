import { describe, expect, it } from "vitest";

import { TRAININGPEAKS_METRICS_FIXTURE } from "../../test-utils/trainingpeaks-fixture";
import {
  TRAININGPEAKS_DEFERRED_METRIC_TYPES,
  TRAININGPEAKS_WEIGHT_METRIC_TYPE,
  trainingPeaksConsolidatedMetricSchema,
  trainingPeaksMetricDetailSchema,
  trainingPeaksMetricsResponseSchema,
} from "./trainingpeaks-metric.schema";

const WEIGHT_TYPE_ID = 9;
const WEIGHT_VALUE_KG = 80.5;
const FIXTURE_ENTRY_COUNT = 4;

describe("trainingPeaksMetricDetailSchema", () => {
  it("should parse a weight detail and drop unknown fields", () => {
    // Arrange
    const raw = {
      type: WEIGHT_TYPE_ID,
      value: WEIGHT_VALUE_KG,
      units: "kg",
      unknownField: "ignored",
    };

    // Act
    const parsed = trainingPeaksMetricDetailSchema.parse(raw);

    // Assert
    expect(parsed).toEqual({
      type: WEIGHT_TYPE_ID,
      value: WEIGHT_VALUE_KG,
      units: "kg",
    });
  });

  it("should accept a null value for an unmeasured channel", () => {
    // Arrange
    const raw = { type: WEIGHT_TYPE_ID, value: null };

    // Act
    const parsed = trainingPeaksMetricDetailSchema.parse(raw);

    // Assert
    expect(parsed.value).toBeNull();
  });
});

describe("trainingPeaksConsolidatedMetricSchema", () => {
  it("should default a missing details list to an empty array", () => {
    // Arrange
    const raw = { timeStamp: "2026-07-01T07:30:00Z" };

    // Act
    const parsed = trainingPeaksConsolidatedMetricSchema.parse(raw);

    // Assert
    expect(parsed.details).toEqual([]);
  });
});

describe("trainingPeaksMetricsResponseSchema", () => {
  it("should parse the synthetic metrics fixture array", () => {
    // Arrange
    const response = TRAININGPEAKS_METRICS_FIXTURE;

    // Act
    const parsed = trainingPeaksMetricsResponseSchema.parse(response);

    // Assert
    expect(parsed).toHaveLength(FIXTURE_ENTRY_COUNT);
  });
});

describe("metric type ids", () => {
  it("should not defer the weight metric type", () => {
    // Arrange
    const deferred = TRAININGPEAKS_DEFERRED_METRIC_TYPES;

    // Act
    const includesWeight = deferred.includes(
      TRAININGPEAKS_WEIGHT_METRIC_TYPE as (typeof deferred)[number]
    );

    // Assert
    expect(includesWeight).toBe(false);
  });
});
