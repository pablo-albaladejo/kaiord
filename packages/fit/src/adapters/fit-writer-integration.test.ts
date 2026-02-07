import { describe, expect, it } from "vitest";
import { buildKRD } from "@kaiord/core/test-utils";
import { buildKRDMetadata } from "@kaiord/core/test-utils";
import { buildWorkoutStep } from "@kaiord/core/test-utils";
import { createMockLogger } from "@kaiord/core/test-utils";
import {
  createGarminFitSdkReader,
  createGarminFitSdkWriter,
} from "./garmin-fitsdk";

describe("FIT Writer Integration", () => {
  it("should successfully encode and decode a simple workout", async () => {
    // Arrange
    const logger = createMockLogger();
    const writer = createGarminFitSdkWriter(logger);
    const reader = createGarminFitSdkReader(logger);

    const krd = buildKRD.build({
      version: "1.0",
      type: "structured_workout",
      metadata: buildKRDMetadata.build({
        sport: "cycling",
      }),
      extensions: {
        structured_workout: {
          name: "Test Workout",
          sport: "cycling",
          steps: [
            buildWorkoutStep.build({
              stepIndex: 0,
              durationType: "time",
              duration: { type: "time", seconds: 300 },
              targetType: "power",
              target: {
                type: "power",
                value: { unit: "watts", value: 200 },
              },
            }),
          ],
        },
      },
    });

    // Act - Write KRD to FIT
    const fitBuffer = await writer(krd);

    // Assert - Buffer should be created
    expect(fitBuffer).toBeInstanceOf(Uint8Array);
    expect(fitBuffer.length).toBeGreaterThan(0);

    // Act - Read FIT back to KRD
    const decodedKrd = await reader(fitBuffer);

    // Assert - Basic structure preserved
    expect(decodedKrd.version).toBe("1.0");
    expect(decodedKrd.type).toBe("structured_workout");
    expect(decodedKrd.metadata.sport).toBe("cycling");
  });
});
