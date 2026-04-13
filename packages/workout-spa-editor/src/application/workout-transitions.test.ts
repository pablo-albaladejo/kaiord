/**
 * Workout State Machine Tests
 *
 * Tests all valid/invalid transitions, stale detection,
 * and stale conflict resolution.
 */

import { describe, expect, it } from "vitest";

import type { AiMeta, WorkoutRaw } from "../types/calendar-fragments";
import type { WorkoutRecord } from "../types/calendar-record";
import type { KRD } from "../types/schemas";

import { detectStale } from "./stale-detection";
import { hasConflict, keepUserVersion } from "./stale-resolution";
import {
  transitionToModified,
  transitionToPushed,
  transitionToRaw,
  transitionToReady,
  transitionToSkipped,
  transitionToStructured,
} from "./workout-transitions";

const makeKrd = (): KRD => ({
  version: "1.0",
  type: "structured_workout",
  metadata: { created: "2026-01-01T00:00:00Z", sport: "running" },
});

const makeAiMeta = (processedAt = "2026-01-01T12:00:00Z"): AiMeta => ({
  promptVersion: "1.0",
  model: "gpt-4",
  provider: "openai",
  processedAt,
});

const makeRaw = (desc = "Run 5k easy"): WorkoutRaw => ({
  title: "Easy Run",
  description: desc,
  comments: [],
  distance: null,
  duration: null,
  prescribedRpe: null,
  rawHash: "abc123",
});

const makeWorkout = (
  overrides: Partial<WorkoutRecord> = {}
): WorkoutRecord => ({
  id: "550e8400-e29b-41d4-a716-446655440000",
  date: "2026-01-15",
  sport: "running",
  source: "train2go",
  sourceId: "ext-1",
  planId: null,
  state: "raw",
  raw: makeRaw(),
  krd: null,
  lastProcessingError: null,
  feedback: null,
  aiMeta: null,
  garminPushId: null,
  tags: [],
  previousState: null,
  createdAt: "2026-01-01T00:00:00Z",
  modifiedAt: null,
  updatedAt: "2026-01-01T00:00:00Z",
  ...overrides,
});

describe("transitionToStructured", () => {
  it("should transition from raw to structured", () => {
    const workout = makeWorkout({ state: "raw" });
    const krd = makeKrd();
    const aiMeta = makeAiMeta();

    const result = transitionToStructured(workout, krd, aiMeta);

    expect(result.state).toBe("structured");
    expect(result.krd).toBe(krd);
    expect(result.aiMeta).toBe(aiMeta);
    expect(result.lastProcessingError).toBeNull();
  });

  it("should throw for non-raw source state", () => {
    const workout = makeWorkout({ state: "structured" });

    expect(() =>
      transitionToStructured(workout, makeKrd(), makeAiMeta())
    ).toThrow("Cannot transition from structured to structured");
  });
});

describe("transitionToReady", () => {
  it("should transition from structured to ready", () => {
    const workout = makeWorkout({ state: "structured", krd: makeKrd() });

    const result = transitionToReady(workout);

    expect(result.state).toBe("ready");
  });

  it("should throw for non-structured source state", () => {
    const workout = makeWorkout({ state: "raw" });

    expect(() => transitionToReady(workout)).toThrow(
      "Cannot transition from raw to ready"
    );
  });
});

describe("transitionToPushed", () => {
  it("should transition from ready to pushed", () => {
    const workout = makeWorkout({ state: "ready", krd: makeKrd() });

    const result = transitionToPushed(workout, "garmin-123");

    expect(result.state).toBe("pushed");
    expect(result.garminPushId).toBe("garmin-123");
  });

  it("should transition from modified to pushed", () => {
    const workout = makeWorkout({
      state: "modified",
      krd: makeKrd(),
      garminPushId: "garmin-old",
    });

    const result = transitionToPushed(workout, "garmin-456");

    expect(result.state).toBe("pushed");
    expect(result.garminPushId).toBe("garmin-456");
  });

  it("should throw for invalid source states", () => {
    expect(() =>
      transitionToPushed(makeWorkout({ state: "raw" }), "g-1")
    ).toThrow("Cannot transition from raw to pushed");

    expect(() =>
      transitionToPushed(makeWorkout({ state: "skipped" }), "g-1")
    ).toThrow("Cannot transition from skipped to pushed");
  });
});

describe("transitionToModified", () => {
  it("should transition from pushed to modified with new KRD", () => {
    const workout = makeWorkout({
      state: "pushed",
      krd: makeKrd(),
      garminPushId: "garmin-123",
    });
    const newKrd = makeKrd();

    const result = transitionToModified(workout, newKrd);

    expect(result.state).toBe("modified");
    expect(result.krd).toBe(newKrd);
    expect(result.modifiedAt).not.toBeNull();
    expect(result.garminPushId).toBe("garmin-123");
  });

  it("should throw for non-pushed source state", () => {
    expect(() =>
      transitionToModified(makeWorkout({ state: "ready" }), makeKrd())
    ).toThrow("Cannot transition from ready to modified");
  });
});

describe("transitionToSkipped", () => {
  it("should transition from raw to skipped", () => {
    const result = transitionToSkipped(makeWorkout({ state: "raw" }));

    expect(result.state).toBe("skipped");
  });

  it("should throw for non-raw source state", () => {
    expect(() =>
      transitionToSkipped(makeWorkout({ state: "structured" }))
    ).toThrow("Cannot transition from structured to skipped");
  });
});

describe("transitionToRaw (un-skip)", () => {
  it("should transition from skipped to raw", () => {
    const result = transitionToRaw(makeWorkout({ state: "skipped" }));

    expect(result.state).toBe("raw");
  });

  it("should throw for non-skipped source state", () => {
    expect(() => transitionToRaw(makeWorkout({ state: "pushed" }))).toThrow(
      "Cannot transition from pushed to raw"
    );
  });
});

describe("detectStale", () => {
  it("should return unchanged when rawHash matches", async () => {
    const raw = makeRaw("Run 5k easy");
    const workout = makeWorkout({
      state: "structured",
      raw: { ...raw, rawHash: "will-be-computed" },
    });
    const { computeRawHash } = await import("../lib/raw-hash");
    const hash = await computeRawHash(raw);
    workout.raw = { ...raw, rawHash: hash };

    const result = await detectStale(workout, raw);

    expect(result).toBe(workout);
  });

  it("should update raw in-place for raw state", async () => {
    const workout = makeWorkout({ state: "raw", raw: makeRaw("old") });
    const newRaw = makeRaw("new description");

    const result = await detectStale(workout, newRaw);

    expect(result.state).toBe("raw");
    expect(result.raw?.description).toBe("new description");
    expect(result).not.toBe(workout);
  });

  it("should not transition skipped to stale", async () => {
    const workout = makeWorkout({ state: "skipped", raw: makeRaw("old") });
    const newRaw = makeRaw("new description");

    const result = await detectStale(workout, newRaw);

    expect(result.state).toBe("skipped");
    expect(result).toBe(workout);
  });

  it("should transition structured to stale", async () => {
    const workout = makeWorkout({
      state: "structured",
      krd: makeKrd(),
      aiMeta: makeAiMeta(),
      raw: makeRaw("old"),
    });
    const newRaw = makeRaw("updated by coach");

    const result = await detectStale(workout, newRaw);

    expect(result.state).toBe("stale");
    expect(result.previousState).toBe("structured");
    expect(result.krd).toBe(workout.krd);
    expect(result.raw?.description).toBe("updated by coach");
  });

  it("should transition pushed to stale preserving garminPushId", async () => {
    const workout = makeWorkout({
      state: "pushed",
      krd: makeKrd(),
      garminPushId: "garmin-123",
      raw: makeRaw("old"),
    });
    const newRaw = makeRaw("coach changed it");

    const result = await detectStale(workout, newRaw);

    expect(result.state).toBe("stale");
    expect(result.previousState).toBe("pushed");
    expect(result.garminPushId).toBe("garmin-123");
  });

  it("should transition modified to stale", async () => {
    const workout = makeWorkout({
      state: "modified",
      krd: makeKrd(),
      garminPushId: "garmin-123",
      raw: makeRaw("old"),
    });
    const newRaw = makeRaw("coach changed it again");

    const result = await detectStale(workout, newRaw);

    expect(result.state).toBe("stale");
    expect(result.previousState).toBe("modified");
  });

  it("should transition ready to stale", async () => {
    const workout = makeWorkout({
      state: "ready",
      krd: makeKrd(),
      raw: makeRaw("old"),
    });
    const newRaw = makeRaw("updated");

    const result = await detectStale(workout, newRaw);

    expect(result.state).toBe("stale");
    expect(result.previousState).toBe("ready");
  });
});

describe("hasConflict", () => {
  it("should return false for non-stale workout", () => {
    expect(hasConflict(makeWorkout({ state: "raw" }))).toBe(false);
  });

  it("should return false when no user edits", () => {
    const workout = makeWorkout({
      state: "stale",
      previousState: "structured",
      aiMeta: makeAiMeta("2026-01-01T12:00:00Z"),
      modifiedAt: null,
    });

    expect(hasConflict(workout)).toBe(false);
  });

  it("should return false when modifiedAt <= processedAt", () => {
    const workout = makeWorkout({
      state: "stale",
      previousState: "structured",
      aiMeta: makeAiMeta("2026-01-01T12:00:00Z"),
      modifiedAt: "2026-01-01T11:00:00Z",
    });

    expect(hasConflict(workout)).toBe(false);
  });

  it("should return true when modifiedAt > processedAt", () => {
    const workout = makeWorkout({
      state: "stale",
      previousState: "pushed",
      aiMeta: makeAiMeta("2026-01-01T12:00:00Z"),
      modifiedAt: "2026-01-01T13:00:00Z",
    });

    expect(hasConflict(workout)).toBe(true);
  });

  it("should return true for null aiMeta with modifiedAt", () => {
    const workout = makeWorkout({
      state: "stale",
      previousState: "structured",
      aiMeta: null,
      modifiedAt: "2026-01-01T10:00:00Z",
    });

    expect(hasConflict(workout)).toBe(true);
  });

  it("should return false for null aiMeta without modifiedAt", () => {
    const workout = makeWorkout({
      state: "stale",
      previousState: "structured",
      aiMeta: null,
      modifiedAt: null,
    });

    expect(hasConflict(workout)).toBe(false);
  });
});

describe("keepUserVersion", () => {
  it("should restore previousState", () => {
    const workout = makeWorkout({
      state: "stale",
      previousState: "pushed",
      krd: makeKrd(),
      garminPushId: "garmin-123",
    });

    const result = keepUserVersion(workout);

    expect(result.state).toBe("pushed");
    expect(result.previousState).toBeNull();
    expect(result.krd).toBe(workout.krd);
    expect(result.garminPushId).toBe("garmin-123");
  });

  it("should throw for non-stale workout", () => {
    expect(() => keepUserVersion(makeWorkout({ state: "raw" }))).toThrow(
      "Can only keep user version on a stale workout"
    );
  });

  it("should throw for stale without previousState", () => {
    expect(() =>
      keepUserVersion(makeWorkout({ state: "stale", previousState: null }))
    ).toThrow("Can only keep user version on a stale workout");
  });
});
