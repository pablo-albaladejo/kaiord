import { describe, expect, it } from "vitest";

import type { CoachingActivityRecord } from "../../types/coaching-activity-record";
import type { KRD } from "../../types/schemas";
import { getStructuredWorkout } from "../../utils/structured-workout";
import { buildStructuredCoachingWorkout } from "./coaching-workout-builder";

const activity = (description?: string): CoachingActivityRecord => ({
  id: "p1:train2go:42",
  profileId: "p1",
  source: "train2go",
  sourceId: "42",
  date: "2026-06-23",
  sport: "bike",
  title: "Endurance",
  status: "pending",
  fetchedAt: "2026-06-23T00:00:00.000Z",
  ...(description !== undefined ? { description } : {}),
});

const krd = (): KRD => ({
  version: "1.0",
  type: "structured_workout",
  metadata: { created: "2026-06-23T00:00:00.000Z", sport: "cycling" },
  extensions: { structured_workout: { sport: "cycling", steps: [] } },
});

const baseInput = (description?: string) => ({
  id: "w1",
  activity: activity(description),
  namespacedSourceId: "p1:42",
  krd: krd(),
  aiMeta: null,
  now: "2026-06-23T00:00:00.000Z",
  sport: "cycling" as const,
});

describe("buildStructuredCoachingWorkout coach notes", () => {
  it("should carry the coach description into KRD workout-level notes", () => {
    // Arrange
    const description = "Tempo — see [video](https://youtu.be/abc)";

    // Act
    const record = buildStructuredCoachingWorkout(baseInput(description));

    // Assert
    expect(getStructuredWorkout(record.krd as KRD)?.notes).toBe(description);
    expect(record.raw.description).toBe(description);
  });

  it("should omit KRD notes when the activity has no description", () => {
    // Arrange
    const input = baseInput(undefined);

    // Act
    const record = buildStructuredCoachingWorkout(input);

    // Assert
    expect(getStructuredWorkout(record.krd as KRD)?.notes).toBeUndefined();
  });
});
