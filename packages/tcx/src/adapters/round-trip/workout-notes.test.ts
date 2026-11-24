import {
  createMockLogger,
  roundTripStep,
  roundTripWorkout,
} from "@kaiord/core/test-utils";
import { describe, expect, it } from "vitest";

import {
  createFastXmlTcxReader,
  createFastXmlTcxWriter,
} from "../fast-xml-parser";
import { createXsdTcxValidator } from "../xsd-validator";

const logger = createMockLogger();
const read = createFastXmlTcxReader(logger);
const write = createFastXmlTcxWriter(logger, createXsdTcxValidator(logger));

const notesAfterRoundTrip = async (notes: string) => {
  const krd = roundTripWorkout(
    "running",
    [roundTripStep({ type: "time", seconds: 60 }, { type: "open" })],
    { notes }
  );
  const xml = await write(krd);
  const back = await read(xml);
  return {
    xml,
    notes: (back.extensions?.structured_workout as { notes?: string }).notes,
  };
};

describe("Round-trip: TCX workout notes", () => {
  it("should write workout notes as the TCX Workout Notes element and read them back", async () => {
    // Arrange
    const notes = "Stay relaxed & keep cadence high.";

    // Act
    const result = await notesAfterRoundTrip(notes);

    // Assert
    expect(result.xml).toContain(
      "<Notes>Stay relaxed &amp; keep cadence high.</Notes>"
    );
    expect(result.notes).toBe(notes);
  });

  it("should read numeric-looking notes back as text", async () => {
    // Arrange
    const notes = "400";

    // Act
    const result = await notesAfterRoundTrip(notes);

    // Assert
    expect(result.notes).toBe(notes);
  });
});
