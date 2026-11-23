import {
  createMockLogger,
  roundTripStep,
  roundTripWorkout,
} from "@kaiord/core/test-utils";
import { describe, expect, it } from "vitest";

import { createGarminReader } from "../garmin-reader";
import { createGarminWriter } from "../garmin-writer";

const logger = createMockLogger();
const read = createGarminReader(logger);
const write = createGarminWriter({ logger });

const NOTES = "Coach: hold the cadence on every rep.";

describe("Round-trip: Garmin Connect workout notes", () => {
  it("should write workout notes as the workout description and read them back", async () => {
    // Arrange
    const krd = roundTripWorkout(
      "running",
      [roundTripStep({ type: "time", seconds: 60 }, { type: "open" })],
      { notes: NOTES }
    );

    // Act
    const gcn = await write(krd);
    const back = await read(gcn);

    // Assert
    expect(JSON.parse(gcn).description).toBe(NOTES);
    expect(
      (back.extensions?.structured_workout as { notes?: string }).notes
    ).toBe(NOTES);
  });

  it("should read a null description as no notes", async () => {
    // Arrange
    const gcn = JSON.stringify({
      workoutName: "W",
      description: null,
      sportType: { sportTypeKey: "running" },
      workoutSegments: [],
    });

    // Act
    const krd = await read(gcn);

    // Assert
    expect(krd.extensions?.structured_workout).not.toHaveProperty("notes");
  });
});
