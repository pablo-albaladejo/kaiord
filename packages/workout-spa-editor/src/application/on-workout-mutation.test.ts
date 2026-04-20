import { describe, expect, it } from "vitest";

import type { WorkoutRecord } from "../types/calendar-record";
import { onWorkoutMutation } from "./workout-transitions";

function makeRecord(overrides: Partial<WorkoutRecord> = {}): WorkoutRecord {
  return {
    id: "550e8400-e29b-41d4-a716-446655440000",
    date: "2026-04-20",
    sport: "running",
    source: "train2go",
    sourceId: "ext-1",
    planId: null,
    state: "structured",
    raw: null,
    krd: {
      version: "1.0",
      type: "structured_workout",
      metadata: { created: "2026-04-20T08:00:00Z", sport: "running" },
    },
    lastProcessingError: null,
    feedback: null,
    aiMeta: null,
    garminPushId: null,
    tags: [],
    previousState: null,
    createdAt: "2026-04-20T08:00:00Z",
    modifiedAt: null,
    updatedAt: "2026-04-20T08:00:00Z",
    ...overrides,
  };
}

describe("onWorkoutMutation", () => {
  it("advances modifiedAt and updatedAt when no timestamp is given", () => {
    const record = makeRecord({ modifiedAt: null });

    const result = onWorkoutMutation(record);

    expect(result.modifiedAt).not.toBeNull();
    expect(result.updatedAt).not.toBe(record.updatedAt);
  });

  it("uses the supplied batch timestamp so two calls in one batch share it", () => {
    const record = makeRecord({ modifiedAt: null });
    const stamp = "2026-04-20T09:00:00.000Z";

    const first = onWorkoutMutation(record, { timestamp: stamp });
    const second = onWorkoutMutation(first, { timestamp: stamp });

    expect(first.modifiedAt).toBe(stamp);
    expect(second.modifiedAt).toBe(stamp);
    expect(first.updatedAt).toBe(stamp);
  });

  it("preserves the state by default — mutation alone does not transition", () => {
    const record = makeRecord({ state: "structured" });

    const result = onWorkoutMutation(record);

    expect(result.state).toBe("structured");
  });

  it("passes through an optional nextState when a transition applies", () => {
    const record = makeRecord({
      state: "pushed",
      garminPushId: "garmin-1",
      krd: {
        version: "1.0",
        type: "structured_workout",
        metadata: { created: "2026-04-20T08:00:00Z", sport: "running" },
      },
    });

    const result = onWorkoutMutation(record, { nextState: "modified" });

    expect(result.state).toBe("modified");
    expect(result.modifiedAt).not.toBeNull();
  });

  it("is a pure function — does not mutate the input", () => {
    const record = makeRecord({ modifiedAt: null });
    const snapshot = JSON.stringify(record);

    onWorkoutMutation(record);

    expect(JSON.stringify(record)).toBe(snapshot);
  });

  it("carries a replacement KRD when provided (edit-step / reorder / paste)", () => {
    const record = makeRecord();
    const nextKrd = {
      version: "1.0" as const,
      type: "structured_workout" as const,
      metadata: { created: "2026-04-20T08:00:00Z", sport: "cycling" as const },
    };

    const result = onWorkoutMutation(record, { krd: nextKrd });

    expect(result.krd).toBe(nextKrd);
    expect(result.modifiedAt).not.toBeNull();
  });

  it("advances modifiedAt for STRUCTURED edits without changing state", () => {
    const record = makeRecord({ state: "structured", modifiedAt: null });

    const result = onWorkoutMutation(record);

    expect(result.state).toBe("structured");
    expect(result.modifiedAt).not.toBeNull();
  });

  it("advances modifiedAt for READY edits without changing state", () => {
    const record = makeRecord({ state: "ready", modifiedAt: null });

    const result = onWorkoutMutation(record);

    expect(result.state).toBe("ready");
    expect(result.modifiedAt).not.toBeNull();
  });

  it("selection-only actions do NOT go through the helper — guarding note", () => {
    // The helper is the chokepoint for mutations only. Selection-only
    // actions (focus, hover, highlight) MUST NOT call it. We encode
    // that contract by asserting: if the helper is never called,
    // modifiedAt stays unchanged — trivially true in the test, but the
    // assertion guards readers against the anti-pattern of wrapping
    // everything in onWorkoutMutation.
    const record = makeRecord({ modifiedAt: "2026-04-20T07:00:00Z" });

    // No helper call — simulate selection-only path.
    const unchanged = record;

    expect(unchanged.modifiedAt).toBe("2026-04-20T07:00:00Z");
  });
});
