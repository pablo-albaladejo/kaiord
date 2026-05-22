import { describe, expect, it } from "vitest";

import { mapFitHrvToKrd, mapKrdHrvToFit } from "./health-hrv.converter";

const MEASURED_AT = "2026-05-22T07:00:00.000Z";
const OVERNIGHT_RMSSD = 48;
const SPOT_RMSSD = 42;

describe("mapFitHrvToKrd", () => {
  it("should prefer hrv_status_summary.lastNightAverage and mark window overnight", () => {
    // Arrange
    const summary = {
      timestamp: new Date(MEASURED_AT),
      lastNightAverage: OVERNIGHT_RMSSD,
      status: "balanced" as const,
    };

    // Act
    const krd = mapFitHrvToKrd(summary, undefined);

    // Assert
    expect(krd).toEqual({
      kind: "hrv",
      version: "2.0",
      measuredAt: MEASURED_AT,
      rMSSD: OVERNIGHT_RMSSD,
      measurementWindow: "overnight",
    });
  });

  it("should fall back to the first hrv_value with window spot when no summary is present", () => {
    // Arrange
    const value = { timestamp: new Date(MEASURED_AT), value: SPOT_RMSSD };

    // Act
    const krd = mapFitHrvToKrd(undefined, value);

    // Assert
    expect(krd?.measurementWindow).toBe("spot");
    expect(krd?.rMSSD).toBe(SPOT_RMSSD);
  });

  it("should return undefined when neither summary nor value carries RMSSD", () => {
    // Arrange
    const summary = undefined;
    const value = undefined;

    // Act
    const krd = mapFitHrvToKrd(summary, value);

    // Assert
    expect(krd).toBeUndefined();
  });
});

describe("mapKrdHrvToFit", () => {
  it("should emit lastNightAverage from rMSSD and default status to balanced", () => {
    // Arrange
    const hrv = {
      kind: "hrv" as const,
      version: "2.0",
      measuredAt: MEASURED_AT,
      rMSSD: OVERNIGHT_RMSSD,
      measurementWindow: "overnight" as const,
    };

    // Act
    const fit = mapKrdHrvToFit(hrv);

    // Assert
    expect(fit.lastNightAverage).toBe(OVERNIGHT_RMSSD);
    expect(fit.status).toBe("balanced");
    expect((fit.timestamp as Date).toISOString()).toBe(MEASURED_AT);
  });
});
