/**
 * The personal fields Kaiord for TrainingPeaks removes from its answers are
 * ones the TrainingPeaks Connector never reads: a metrics range reads to the
 * same weight, and a workout to the same id and day, once trimmed, with the
 * workout's comments gone.
 */
import { trainingPeaksMetricsToKrd } from "@kaiord/trainingpeaks";
import { describe, expect, it } from "vitest";

import { trimmedByBridge } from "../../../test-utils/bridge-answer-trim";
import { readWorkoutIdentity } from "./read-trainingpeaks-answers";

const BRIDGE = "trainingpeaks-bridge";
const json = (payload: unknown) => ({
  status: 200,
  contentType: "application/json; charset=utf-8",
  body: JSON.stringify(payload),
});

describe("TrainingPeaks answers trimmed of personal fields", () => {
  it("should read the same weight from a trimmed metrics range", () => {
    // Arrange
    const raw = json([
      {
        athleteId: 900123,
        timeStamp: "2026-07-01T07:30:00",
        id: 111,
        details: [
          {
            type: 9,
            label: "Weight",
            value: 80.5,
            units: "kg",
            time: "2026-07-01T07:30:00",
          },
          { type: 5, label: "Resting Pulse", value: 52, units: "bpm" },
        ],
      },
    ]);

    // Act
    const trimmed = trimmedByBridge(BRIDGE, raw);

    // Assert
    expect(trimmed.body).toBe(raw.body);
    expect(trainingPeaksMetricsToKrd(JSON.parse(trimmed.body))).toHaveLength(1);
  });

  it("should read the same id and day from a trimmed workout, its comments gone", () => {
    // Arrange
    const raw = json({
      workoutId: 4242,
      workoutDay: "2026-11-24T00:00:00",
      coachComments: "Felt heavy?",
      workoutComments: [{ comment: "ok" }],
    });

    // Act
    const trimmed = trimmedByBridge(BRIDGE, raw);

    // Assert
    expect(readWorkoutIdentity(trimmed)).toEqual(readWorkoutIdentity(raw));
    expect(trimmed.body).not.toContain("Comments");
  });
});
