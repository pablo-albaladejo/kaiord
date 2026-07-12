import {
  HEART_RATE_SERIES_BPM_TOLERANCE,
  heartRateSeriesSchema,
} from "@kaiord/core";
import { describe, expect, it } from "vitest";

import {
  HEART_RATE_METRICS_FIRST_SAMPLE_TIME,
  HEART_RATE_METRICS_FIXTURE,
} from "../../test-utils/metrics-fixture";
import type { WhoopMetricsResponse } from "../schemas/whoop-metrics.schema";
import { metricsToHeartRateSeries } from "./metrics-to-heart-rate-series.converter";

const USER_ID = 42;
const DATE = "2026-07-10";
const STEP_SECONDS = 6;
const EXPECTED_START_TIME = new Date(
  HEART_RATE_METRICS_FIRST_SAMPLE_TIME
).toISOString();
const EXPECTED_LENGTH = 5;
const GAP_SLOT_INDEX = 2;
const BPM_58 = 58;
const BPM_60 = 60;
const BPM_61 = 61;
const BPM_59 = 59;
const BPM_300 = 300;
const MS_PER_SECOND = 1000;
const ONE_STEP_MS = STEP_SECONDS * MS_PER_SECOND;
const TWO_STEPS_MS = ONE_STEP_MS * 2;
const LARGE_STEP_SECONDS = 60;
const LARGE_STEP_TWO_SLOTS_MS = LARGE_STEP_SECONDS * MS_PER_SECOND * 2;

describe("metricsToHeartRateSeries", () => {
  it("should bucket samples into a uniform-interval array with a null gap", () => {
    // Arrange

    // Act
    const series = metricsToHeartRateSeries(HEART_RATE_METRICS_FIXTURE, {
      userId: USER_ID,
      date: DATE,
      stepSeconds: STEP_SECONDS,
    });

    // Assert
    expect(series?.samples).toHaveLength(EXPECTED_LENGTH);
    expect(series?.samples).toEqual([BPM_58, BPM_60, null, BPM_61, BPM_59]);
    expect(series?.samples[GAP_SLOT_INDEX]).toBeNull();
  });

  it("should set startTime to the ISO timestamp of the first sample", () => {
    // Arrange

    // Act
    const series = metricsToHeartRateSeries(HEART_RATE_METRICS_FIXTURE, {
      userId: USER_ID,
      date: DATE,
      stepSeconds: STEP_SECONDS,
    });

    // Assert
    expect(series?.startTime).toBe(EXPECTED_START_TIME);
  });

  it("should set intervalSeconds to the requested stepSeconds", () => {
    // Arrange

    // Act
    const series = metricsToHeartRateSeries(HEART_RATE_METRICS_FIXTURE, {
      userId: USER_ID,
      date: DATE,
      stepSeconds: STEP_SECONDS,
    });

    // Assert
    expect(series?.intervalSeconds).toBe(STEP_SECONDS);
  });

  it("should set externalId from userId and date", () => {
    // Arrange

    // Act
    const series = metricsToHeartRateSeries(HEART_RATE_METRICS_FIXTURE, {
      userId: USER_ID,
      date: DATE,
      stepSeconds: STEP_SECONDS,
    });

    // Assert
    expect(series?.externalId).toBe(`hr:${USER_ID}:${DATE}`);
    expect(series?.kind).toBe("heart-rate-series");
    expect(series?.version).toBe("2.0");
    expect(series?.sourceBridgeId).toBe("whoop-bridge");
  });

  it("should produce a heart-rate series that validates against the KRD schema", () => {
    // Arrange
    const series = metricsToHeartRateSeries(HEART_RATE_METRICS_FIXTURE, {
      userId: USER_ID,
      date: DATE,
      stepSeconds: STEP_SECONDS,
    });

    // Act
    const result = heartRateSeriesSchema.safeParse(series);

    // Assert
    expect(result.success).toBe(true);
  });

  it("should round and clamp a float/over-range bpm reading", () => {
    // Arrange
    const response: WhoopMetricsResponse = {
      values: [
        { data: 58.6, time: HEART_RATE_METRICS_FIRST_SAMPLE_TIME },
        { data: 305, time: HEART_RATE_METRICS_FIRST_SAMPLE_TIME + ONE_STEP_MS },
        {
          data: -12,
          time: HEART_RATE_METRICS_FIRST_SAMPLE_TIME + TWO_STEPS_MS,
        },
      ],
    };

    // Act
    const series = metricsToHeartRateSeries(response, {
      userId: USER_ID,
      date: DATE,
      stepSeconds: STEP_SECONDS,
    });

    // Assert
    expect(series?.samples).toEqual([BPM_59, BPM_300, 0]);
    expect(Math.abs((series?.samples[0] ?? 0) - BPM_59)).toBeLessThanOrEqual(
      HEART_RATE_SERIES_BPM_TOLERANCE
    );
  });

  it("should return null when values is empty", () => {
    // Arrange
    const response: WhoopMetricsResponse = { values: [] };

    // Act
    const series = metricsToHeartRateSeries(response, {
      userId: USER_ID,
      date: DATE,
      stepSeconds: STEP_SECONDS,
    });

    // Assert
    expect(series).toBeNull();
  });

  it("should return null when values is absent", () => {
    // Arrange
    const response: WhoopMetricsResponse = {};

    // Act
    const series = metricsToHeartRateSeries(response, {
      userId: USER_ID,
      date: DATE,
      stepSeconds: STEP_SECONDS,
    });

    // Assert
    expect(series).toBeNull();
  });

  it("should respect a different stepSeconds when bucketing", () => {
    // Arrange
    const response: WhoopMetricsResponse = {
      values: [
        { data: BPM_58, time: HEART_RATE_METRICS_FIRST_SAMPLE_TIME },
        {
          data: BPM_60,
          time: HEART_RATE_METRICS_FIRST_SAMPLE_TIME + LARGE_STEP_TWO_SLOTS_MS,
        },
      ],
    };

    // Act
    const series = metricsToHeartRateSeries(response, {
      userId: USER_ID,
      date: DATE,
      stepSeconds: LARGE_STEP_SECONDS,
    });

    // Assert
    expect(series?.intervalSeconds).toBe(LARGE_STEP_SECONDS);
    expect(series?.samples).toEqual([BPM_58, null, BPM_60]);
  });
});
