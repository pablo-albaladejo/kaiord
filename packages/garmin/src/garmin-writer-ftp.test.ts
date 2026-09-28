import type { KRD } from "@kaiord/core";
import { MissingFtpError, toText } from "@kaiord/core";
import { describe, expect, it } from "vitest";

import { createGarminWriter } from "./index";
import { FTP_RESOLUTION as F } from "./test-utils/constants";

const silentLogger = {
  debug: () => {},
  info: () => {},
  warn: () => {},
  error: () => {},
};

const percentFtpWorkout: KRD = {
  version: "1.0",
  type: "structured_workout",
  metadata: { created: "2026-01-01T00:00:00.000Z", sport: "cycling" },
  extensions: {
    structured_workout: {
      name: "Sweet spot",
      sport: "cycling",
      steps: [
        {
          stepIndex: 0,
          durationType: "time",
          duration: { type: "time", seconds: 600 },
          targetType: "power",
          target: { type: "power", value: { unit: "percent_ftp", value: 85 } },
        },
      ],
    },
  },
};

type GcnStep = { targetValueOne: number | null; targetValueTwo: number | null };

const firstStep = (gcn: string): GcnStep =>
  (JSON.parse(gcn) as { workoutSegments: [{ workoutSteps: [GcnStep] }] })
    .workoutSegments[0].workoutSteps[0];

describe("createGarminWriter ftpWatts option", () => {
  it("should write percent_ftp power targets as watts using ftpWatts", async () => {
    // Arrange
    const writer = createGarminWriter({
      logger: silentLogger,
      ftpWatts: F.FTP_W,
    });

    // Act
    const gcn = await toText(percentFtpWorkout, writer, silentLogger);

    // Assert
    expect(firstStep(gcn).targetValueOne).toBe(F.SWEET_SPOT_W);
    expect(firstStep(gcn).targetValueTwo).toBe(F.SWEET_SPOT_W);
  });

  it("should reject percent_ftp power targets when no FTP is configured", async () => {
    // Arrange
    const writer = createGarminWriter(silentLogger);

    // Act
    const write = toText(percentFtpWorkout, writer, silentLogger);

    // Assert
    await expect(write).rejects.toBeInstanceOf(MissingFtpError);
  });
});
