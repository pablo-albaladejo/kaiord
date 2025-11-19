import { describe, expect, it } from "vitest";
import { buildKRD } from "../../tests/fixtures/krd/krd.fixtures";
import { buildKRDMetadata } from "../../tests/fixtures/krd/metadata.fixtures";
import { buildWorkoutStep } from "../../tests/fixtures/workout/workout-step.fixtures";
import { createMockLogger } from "../../tests/helpers/test-utils";
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
      type: "workout",
      metadata: buildKRDMetadata.build({
        sport: "cycling",
      }),
      extensions: {
        workout: {
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
    expect(decodedKrd.type).toBe("workout");
    expect(decodedKrd.metadata.sport).toBe("cycling");
  });
});
