import { createMockLogger } from "@kaiord/core/test-utils";
import { describe, expect, it } from "vitest";

import type { FitMessages } from "../shared/types";
import { mapMessagesToKRD } from "./messages.mapper";

const CREATED_AT = new Date("2026-05-22T07:00:00.000Z");
const STAGE_TIMESTAMP = new Date("2026-05-21T23:30:00.000Z");
const ONE_MINUTE_MS = 60_000;

const fileIdMesg = { type: "sleep", timeCreated: CREATED_AT };
const workoutFileIdMesg = {
  type: "workout",
  timeCreated: CREATED_AT,
  manufacturer: "garmin",
};

describe("mapMessagesToKRD — unknown messages dispatch", () => {
  it("should preserve unrecognised SDK message keys under extensions.fit.unknownMessages", () => {
    // Arrange
    const logger = createMockLogger();
    const messages: FitMessages = {
      fileIdMesgs: [workoutFileIdMesg],
      workoutMesgs: [{ sport: "cycling", wktName: "Test" }],
      mysteryMesgs: [{ mesgNum: 9999, foo: "bar" }],
    };

    // Act
    const krd = mapMessagesToKRD(messages, logger);

    // Assert
    const fitExt = (krd.extensions as { fit?: { unknownMessages?: unknown } })
      ?.fit;
    expect(fitExt?.unknownMessages).toBeDefined();
    expect(fitExt?.unknownMessages).toMatchObject({
      mysteryMesgs: [{ mesgNum: 9999, foo: "bar" }],
    });
  });
});

describe("mapMessagesToKRD — known health dispatch", () => {
  it("should route sleepLevelMesgs to a sleep_record KRD with extensions.health.sleep", () => {
    // Arrange
    const logger = createMockLogger();
    const messages: FitMessages = {
      fileIdMesgs: [fileIdMesg],
      sleepLevelMesgs: [
        { timestamp: STAGE_TIMESTAMP, sleepLevel: "light" },
        {
          timestamp: new Date(STAGE_TIMESTAMP.getTime() + ONE_MINUTE_MS),
          sleepLevel: "deep",
        },
      ],
    };

    // Act
    const krd = mapMessagesToKRD(messages, logger);

    // Assert
    expect(krd.type).toBe("sleep_record");
    const health = (krd.extensions as { health?: { sleep?: unknown } })?.health;
    expect(health?.sleep).toBeDefined();
  });

  it("should route monitoringMesgs to a daily_wellness KRD with extensions.health.daily", () => {
    // Arrange
    const logger = createMockLogger();
    const messages: FitMessages = {
      fileIdMesgs: [{ type: "monitoringDaily", timeCreated: CREATED_AT }],
      monitoringInfoMesgs: [
        { timestamp: CREATED_AT, localTimestamp: CREATED_AT },
      ],
      monitoringMesgs: [{ timestamp: CREATED_AT, steps: 5000 }],
    };

    // Act
    const krd = mapMessagesToKRD(messages, logger);

    // Assert
    expect(krd.type).toBe("daily_wellness");
    const health = (krd.extensions as { health?: { daily?: unknown } })?.health;
    expect(health?.daily).toBeDefined();
  });

  it("should route weightScaleMesgs to a weight_measurement KRD with extensions.health.weight", () => {
    // Arrange
    const logger = createMockLogger();
    const messages: FitMessages = {
      fileIdMesgs: [{ type: "weight", timeCreated: CREATED_AT }],
      weightScaleMesgs: [{ timestamp: CREATED_AT, weight: 75.5 }],
    };

    // Act
    const krd = mapMessagesToKRD(messages, logger);

    // Assert
    expect(krd.type).toBe("weight_measurement");
    const health = (krd.extensions as { health?: { weight?: unknown } })
      ?.health;
    expect(health?.weight).toBeDefined();
  });

  it("should route stressLevelMesgs to a stress_episode KRD with extensions.health.stress", () => {
    // Arrange
    const logger = createMockLogger();
    const messages: FitMessages = {
      fileIdMesgs: [{ type: "monitoringDaily", timeCreated: CREATED_AT }],
      stressLevelMesgs: [
        { stressLevelTime: CREATED_AT, stressLevelValue: 35 },
        {
          stressLevelTime: new Date(CREATED_AT.getTime() + ONE_MINUTE_MS),
          stressLevelValue: 50,
        },
      ],
    };

    // Act
    const krd = mapMessagesToKRD(messages, logger);

    // Assert
    expect(krd.type).toBe("stress_episode");
    const health = (krd.extensions as { health?: { stress?: unknown } })
      ?.health;
    expect(health?.stress).toBeDefined();
  });
});
