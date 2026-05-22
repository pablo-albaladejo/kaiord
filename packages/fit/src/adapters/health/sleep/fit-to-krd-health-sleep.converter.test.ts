import { createMockLogger } from "@kaiord/core/test-utils";
import { describe, expect, it } from "vitest";

import type { FitMessages } from "../../shared/types";
import { convertFitToKrdHealthSleep } from "./fit-to-krd-health-sleep.converter";

describe("convertFitToKrdHealthSleep", () => {
  it("should produce a KRD sleep_record with undefined extensions when no sleep_level messages are present", () => {
    // Arrange
    const messages: FitMessages = {
      fileIdMesgs: [{ timeCreated: new Date("2026-05-22T07:00:00.000Z") }],
    };
    const logger = createMockLogger();

    // Act
    const krd = convertFitToKrdHealthSleep(messages, logger);

    // Assert
    expect(krd.type).toBe("sleep_record");
    expect(krd.version).toBe("2.0");
    expect(krd.extensions).toBeUndefined();
  });

  it("should skip malformed sleep_level entries and still produce a valid KRD", () => {
    // Arrange
    const messages: FitMessages = {
      fileIdMesgs: [{ timeCreated: new Date("2026-05-22T07:00:00.000Z") }],
      sleepLevelMesgs: [
        {
          timestamp: new Date("2026-05-21T23:00:00.000Z"),
          sleepLevel: "light",
        },
        { foo: "bar" },
        {
          timestamp: new Date("2026-05-22T07:00:00.000Z"),
          sleepLevel: "awake",
        },
      ],
    };
    const logger = createMockLogger();

    // Act
    const krd = convertFitToKrdHealthSleep(messages, logger);

    // Assert
    const sleep = (
      krd.extensions as { health?: { sleep?: { stages: unknown[] } } }
    )?.health?.sleep;
    expect(sleep).toBeDefined();
    expect(sleep?.stages.length).toBeGreaterThan(0);
  });
});
