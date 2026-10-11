import type { HrvSummary, SleepRecord, StressEpisode } from "@kaiord/core";
import { describe, expect, it } from "vitest";

import { buildReadinessModel } from "./today-readiness";

const EXPECTED_COMPOSITE = 75;
const EXPECTED_BATTERY = 65;
const TYPED_SCORE = 81;

const HRV: HrvSummary = {
  kind: "hrv",
  version: "2.0",
  measuredAt: "2026-05-27T05:00:00.000Z",
  rMSSD: 62.4,
  measurementWindow: "overnight",
  score: 80,
};

const SLEEP: SleepRecord = {
  kind: "sleep",
  version: "2.0",
  startTime: "2026-05-26T22:00:00.000Z",
  endTime: "2026-05-27T06:00:00.000Z",
  totalDurationSeconds: 28800,
  stages: [],
  score: 70,
};

// Mean averageLevel (30, 40) = 35 → energy = 100 − 35 = 65.
const STRESS: StressEpisode[] = [
  {
    kind: "stress",
    version: "2.0",
    startTime: "2026-05-27T08:00:00.000Z",
    endTime: "2026-05-27T10:00:00.000Z",
    averageLevel: 30,
    peakLevel: 55,
  },
  {
    kind: "stress",
    version: "2.0",
    startTime: "2026-05-27T12:00:00.000Z",
    endTime: "2026-05-27T14:00:00.000Z",
    averageLevel: 40,
    peakLevel: 60,
  },
];

describe("buildReadinessModel", () => {
  it("should average available scores into a composite", () => {
    // Arrange

    // Act
    const model = buildReadinessModel(HRV, SLEEP, STRESS, true);

    // Assert
    expect(model.score).toBe(EXPECTED_COMPOSITE);
    expect(model.headline).toBe("Good to push today");
  });

  it("should drop the present-tense today suffix when focus is a past day", () => {
    // Arrange

    // Act
    const model = buildReadinessModel(HRV, SLEEP, STRESS, false);

    // Assert
    expect(model.headline).toBe("Good to push");
  });

  it("should fall back to em-dash placeholders when data is absent", () => {
    // Arrange

    // Act
    const model = buildReadinessModel(undefined, undefined, undefined, true);

    // Assert
    expect(model.score).toBeNull();
    expect(model.hrv.value).toBe("—");
    expect(model.sleep.value).toBe("—");
    expect(model.battery.value).toBe("—");
  });

  it("should render the rounded HRV value from the summary", () => {
    // Arrange

    // Act
    const model = buildReadinessModel(HRV, undefined, undefined, true);

    // Assert
    expect(model.hrv.value).toBe("62");
    expect(model.sleep.value).toBe("—");
  });

  it("should derive battery as 100 minus the mean stress level", () => {
    // Arrange

    // Act
    const model = buildReadinessModel(undefined, undefined, STRESS, true);

    // Assert
    expect(model.battery.value).toBe(`${EXPECTED_BATTERY}`);
  });

  it("should em-dash the battery when no stress is recorded", () => {
    // Arrange

    // Act
    const model = buildReadinessModel(HRV, SLEEP, [], true);

    // Assert
    expect(model.battery.value).toBe("—");
  });

  it("should surface the resolver's source and fallback flag for hrv/sleep when provided", () => {
    // Arrange
    const hrvSource = { sourceBridgeId: "whoop-bridge", usedFallback: false };
    const sleepSource = { sourceBridgeId: "garmin-bridge", usedFallback: true };

    // Act
    const model = buildReadinessModel(
      HRV,
      SLEEP,
      STRESS,
      true,
      hrvSource,
      sleepSource
    );

    // Assert
    expect(model.hrv.source).toBe("whoop-bridge");
    expect(model.hrv.usedFallback).toBe(false);
    expect(model.sleep.source).toBe("garmin-bridge");
    expect(model.sleep.usedFallback).toBe(true);
  });

  it("should leave source and usedFallback undefined when not provided", () => {
    // Arrange

    // Act
    const model = buildReadinessModel(HRV, SLEEP, STRESS, true);

    // Assert
    expect(model.hrv.source).toBeUndefined();
    expect(model.hrv.usedFallback).toBeUndefined();
    expect(model.sleep.source).toBeUndefined();
    expect(model.sleep.usedFallback).toBeUndefined();
  });

  it("should name both inputs when device HRV and sleep scores drive it", () => {
    // Arrange
    const sleepSource = {
      sourceBridgeId: "garmin-bridge",
      usedFallback: false,
    };

    // Act
    const model = buildReadinessModel(
      HRV,
      SLEEP,
      undefined,
      true,
      undefined,
      sleepSource
    );

    // Assert
    expect(model.rationale).toBe("Based on your overnight HRV and sleep.");
  });

  it("should not credit HRV when only a typed-in sleep score drives it", () => {
    // Arrange
    const manualSleep: SleepRecord = { ...SLEEP, score: TYPED_SCORE };
    const sleepSource = { sourceBridgeId: "manual", usedFallback: false };

    // Act
    const model = buildReadinessModel(
      undefined,
      manualSleep,
      undefined,
      true,
      undefined,
      sleepSource
    );

    // Assert
    expect(model.score).toBe(TYPED_SCORE);
    expect(model.rationale).toBe("Based on the sleep score you entered.");
  });

  it("should say a typed-in sleep score was combined with device HRV", () => {
    // Arrange
    const sleepSource = { sourceBridgeId: "manual", usedFallback: false };

    // Act
    const model = buildReadinessModel(
      HRV,
      SLEEP,
      undefined,
      true,
      undefined,
      sleepSource
    );

    // Assert
    expect(model.rationale).toBe(
      "Based on your overnight HRV and the sleep score you entered."
    );
  });

  it("should credit HRV alone when sleep has no score", () => {
    // Arrange
    const unscoredSleep: SleepRecord = { ...SLEEP, score: undefined };

    // Act
    const model = buildReadinessModel(HRV, unscoredSleep, undefined, true);

    // Assert
    expect(model.rationale).toBe("Based on your overnight HRV.");
  });

  it("should show no sleep hours when the duration was not recorded", () => {
    // Arrange
    const scoreOnly: SleepRecord = { ...SLEEP };
    delete scoreOnly.totalDurationSeconds;

    // Act
    const model = buildReadinessModel(undefined, scoreOnly, undefined, true);

    // Assert
    expect(model.sleep.value).toBe("—");
  });

  it("should not show a legacy zero-hour entry as 0.0h", () => {
    // Arrange
    const legacy: SleepRecord = { ...SLEEP, totalDurationSeconds: 0 };

    // Act
    const model = buildReadinessModel(undefined, legacy, undefined, true);

    // Assert
    expect(model.sleep.value).toBe("—");
  });
});
