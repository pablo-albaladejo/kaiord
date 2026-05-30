import type { HrvSummary, SleepRecord } from "@kaiord/core";
import { describe, expect, it } from "vitest";

import { buildReadinessModel } from "./today-readiness";

const EXPECTED_COMPOSITE = 75;

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

describe("buildReadinessModel", () => {
  it("should average available scores into a composite", () => {
    // Arrange

    // Act
    const model = buildReadinessModel(HRV, SLEEP);

    // Assert
    expect(model.score).toBe(EXPECTED_COMPOSITE);
    expect(model.headline).toBe("Good to push today");
  });

  it("should fall back to em-dash placeholders when data is absent", () => {
    // Arrange

    // Act
    const model = buildReadinessModel(undefined, undefined);

    // Assert
    expect(model.score).toBeNull();
    expect(model.hrv.value).toBe("—");
    expect(model.sleep.value).toBe("—");
    expect(model.battery.value).toBe("—");
  });

  it("should render rounded HRV and battery values from the summary", () => {
    // Arrange

    // Act
    const model = buildReadinessModel(HRV, undefined);

    // Assert
    expect(model.hrv.value).toBe("62");
    expect(model.battery.value).toBe("80");
    expect(model.sleep.value).toBe("—");
  });
});
