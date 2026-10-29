import { Encoder } from "@garmin/fitsdk";
import {
  buildKRD,
  buildKRDMetadata,
  buildWorkoutStep,
  createMockLogger,
} from "@kaiord/core/test-utils";
import { describe, expect, it } from "vitest";

import { createEncoder } from "./create-encoder";
import { createGarminFitSdkWriter } from "./garmin-fitsdk";

const SIXTEEN_MIB = 16_777_216;

const buildWorkoutKrd = () =>
  buildKRD.build({
    version: "1.0",
    type: "structured_workout",
    metadata: buildKRDMetadata.build({ sport: "cycling" }),
    extensions: {
      structured_workout: {
        name: "Cap test",
        sport: "cycling",
        steps: [0, 1, 2].map((stepIndex) =>
          buildWorkoutStep.build({
            stepIndex,
            durationType: "time",
            duration: { type: "time", seconds: 300 },
            targetType: "power",
            target: { type: "power", value: { unit: "watts", value: 200 } },
          })
        ),
      },
    },
  });

describe("createEncoder", () => {
  it("should load the patched SDK that forwards OutputStream options", () => {
    // Arrange
    const flag = Encoder.supportsOutputStreamOptions;

    // Act
    const encoder = createEncoder({ maxOutputBytes: SIXTEEN_MIB });

    // Assert
    expect(flag).toBe(true);
    expect(encoder).toBeInstanceOf(Encoder);
  });

  it("should bound the output buffer so encoding past the cap fails", async () => {
    // Arrange
    const writer = createGarminFitSdkWriter(createMockLogger(), {
      maxOutputBytes: 16,
    });

    // Act
    const result = writer(buildWorkoutKrd());

    // Assert
    await expect(result).rejects.toThrow("Failed to write FIT file");
  });

  it("should write byte-identical FIT with a 16 MiB cap and without one", async () => {
    // Arrange
    const krd = buildWorkoutKrd();
    const uncapped = createGarminFitSdkWriter(createMockLogger());
    const capped = createGarminFitSdkWriter(createMockLogger(), {
      maxOutputBytes: SIXTEEN_MIB,
    });

    // Act
    const [plain, bounded] = await Promise.all([uncapped(krd), capped(krd)]);

    // Assert
    expect(bounded.length).toBeGreaterThan(0);
    expect(Array.from(bounded)).toEqual(Array.from(plain));
  });

  it("should reject a cap that is not a positive integer", () => {
    // Arrange
    const options = { maxOutputBytes: 0 };

    // Act
    const create = () => createEncoder(options);

    // Assert
    expect(create).toThrow(RangeError);
  });

  it("should throw when the SDK is unpatched instead of reserving 500 MB", () => {
    // Arrange
    const original = Encoder.supportsOutputStreamOptions;
    Encoder.supportsOutputStreamOptions = undefined;

    // Act
    const create = () => createEncoder({ maxOutputBytes: SIXTEEN_MIB });

    // Assert
    try {
      expect(create).toThrow("patched @garmin/fitsdk");
    } finally {
      Encoder.supportsOutputStreamOptions = original;
    }
  });
});
