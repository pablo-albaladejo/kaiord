import type { Workout } from "@kaiord/core";
import { describe, expect, it } from "vitest";

import { FIT_STRING_MAX_BYTES } from "../shared/fit-string";
import { dropAttachedWorkoutNotes } from "./attached-notes.converter";

const step = (notes?: string): Workout["steps"][number] => ({
  stepIndex: 0,
  durationType: "open",
  duration: { type: "open" },
  targetType: "open",
  target: { type: "open" },
  intensity: "active",
  ...(notes === undefined ? {} : { notes }),
});

describe("dropAttachedWorkoutNotes", () => {
  it("should drop the first step's note when it is the workout notes the writer copied", () => {
    // Arrange
    const steps = [step("Stay seated"), step("Stay seated")];

    // Act
    const result = dropAttachedWorkoutNotes(steps, "Stay seated");

    // Assert
    expect(result).toEqual([step(), step("Stay seated")]);
  });

  it("should drop a copy cut to the bytes of a FIT string", () => {
    // Arrange
    const notes = `${"x".repeat(FIT_STRING_MAX_BYTES)}, and more`;
    const steps = [step("x".repeat(FIT_STRING_MAX_BYTES))];

    // Act
    const result = dropAttachedWorkoutNotes(steps, notes);

    // Assert
    expect(result).toEqual([step()]);
  });

  it("should keep a first-step note of its own, and leave a first repeat block alone", () => {
    // Arrange
    const own = [step("Spin easy")];
    const block = [{ repeatCount: 2, steps: [step("Stay seated")] }];

    // Act
    const results = [
      dropAttachedWorkoutNotes(own, "Stay seated"),
      dropAttachedWorkoutNotes(block, "Stay seated"),
      dropAttachedWorkoutNotes(own, undefined),
    ];

    // Assert
    expect(results).toEqual([own, block, own]);
  });
});
