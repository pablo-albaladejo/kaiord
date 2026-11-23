import type { KRD } from "@kaiord/core";
import {
  createMockLogger,
  roundTripStep,
  roundTripWorkout,
} from "@kaiord/core/test-utils";
import { describe, expect, it } from "vitest";

import {
  createGarminFitSdkReader,
  createGarminFitSdkWriter,
} from "../garmin-fitsdk";

const logger = createMockLogger();
const read = createGarminFitSdkReader(logger);
const write = createGarminFitSdkWriter(logger);

const NOTES = "Coach: stay seated on the hard reps.";

const workoutOf = (krd: KRD) =>
  krd.extensions?.structured_workout as {
    notes?: string;
    steps: Array<{ notes?: string }>;
  };

describe("Round-trip: workout-level notes", () => {
  it("should keep workout notes as the FIT workout description and not as a step note", async () => {
    // Arrange
    const krd = roundTripWorkout(
      "cycling",
      [roundTripStep({ type: "time", seconds: 60 }, { type: "open" })],
      { notes: NOTES }
    );

    // Act
    const back = workoutOf(await read(await write(krd)));

    // Assert
    expect(back.notes).toBe(NOTES);
    expect(back.steps[0]?.notes).toBeUndefined();
  });

  it("should keep a first step note that differs from the workout notes", async () => {
    // Arrange
    const krd = roundTripWorkout(
      "cycling",
      [
        roundTripStep(
          { type: "time", seconds: 60 },
          { type: "open" },
          {
            notes: "Spin easy",
          }
        ),
      ],
      { notes: NOTES }
    );

    // Act
    const back = workoutOf(await read(await write(krd)));

    // Assert
    expect(back.notes).toBe(NOTES);
    expect(back.steps[0]?.notes).toBe("Spin easy");
  });
});

const FIT_STRING_BYTES = 254;
const KRD_NOTES_MAX = 256;
const LONG_WORKOUT_NOTES = 600;

describe("Round-trip: notes longer than a FIT string", () => {
  it("should write a 256-character step note cut to the 254 bytes a FIT string holds", async () => {
    // Arrange
    const notes = "a".repeat(KRD_NOTES_MAX);
    const krd = roundTripWorkout("cycling", [
      roundTripStep({ type: "time", seconds: 60 }, { type: "open" }, { notes }),
    ]);

    // Act
    const back = workoutOf(await read(await write(krd)));

    // Assert
    expect(back.steps[0]?.notes).toBe(notes.substring(0, FIT_STRING_BYTES));
  });

  it("should cut long workout notes on a character boundary within 254 bytes", async () => {
    // Arrange
    const notes = "é".repeat(LONG_WORKOUT_NOTES);
    const krd = roundTripWorkout(
      "cycling",
      [roundTripStep({ type: "time", seconds: 60 }, { type: "open" })],
      { notes }
    );

    // Act
    const back = workoutOf(await read(await write(krd)));

    // Assert
    expect(back.notes).toBe("é".repeat(FIT_STRING_BYTES / 2));
    expect(back.steps[0]?.notes).toBeUndefined();
  });
});
