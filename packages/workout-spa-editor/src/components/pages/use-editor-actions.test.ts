/**
 * Verifies that edits persisted from STRUCTURED and READY states bump
 * `modifiedAt` on the underlying WorkoutRecord — per
 * spa-workout-state-machine §"STALE detection" ("modifiedAt SHALL be
 * updated on any user edit to the KRD, not only on PUSHED→MODIFIED
 * transitions").
 *
 * Exercises `useEditorActions` against an in-memory Dexie (fake-
 * indexeddb) and a pre-seeded workout-store to simulate the flow:
 *   load → edit in Zustand → send → persist.
 *
 * Sending from STRUCTURED also covers the folded-in `structured → ready`
 * transition: Accept is no longer a decision the user makes, but the state
 * machine still passes through READY on the way to PUSHED.
 */

import "fake-indexeddb/auto";

import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";

import { db } from "../../adapters/dexie/dexie-database";
import { useWorkoutStore } from "../../store/workout-store";
import type { WorkoutRecord } from "../../types/calendar-record";
import type { KRD } from "../../types/krd";
import { useEditorActions } from "./use-editor-actions";

const ORIGINAL_KRD: KRD = {
  version: "1.0",
  type: "structured_workout",
  metadata: { created: "2026-04-20T08:00:00Z", sport: "running" },
};

const EDITED_KRD: KRD = {
  version: "1.0",
  type: "structured_workout",
  metadata: { created: "2026-04-20T08:00:00Z", sport: "cycling" },
};

function makeRecord(overrides: Partial<WorkoutRecord> = {}): WorkoutRecord {
  return {
    id: "550e8400-e29b-41d4-a716-446655440099",
    date: "2026-04-20",
    sport: "running",
    source: "train2go",
    sourceId: "ext-1",
    planId: null,
    state: "structured",
    raw: null,
    krd: ORIGINAL_KRD,
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

async function loadPersisted(id: string): Promise<WorkoutRecord | undefined> {
  return db.table<WorkoutRecord>("workouts").get(id);
}

describe("useEditorActions — modifiedAt on STRUCTURED / READY edits", () => {
  beforeEach(async () => {
    await db.table("workouts").clear();
    useWorkoutStore.setState({ currentWorkout: null });
  });

  it("should bump modifiedAt via pushWorkout on STRUCTURED with edits", async () => {
    // Arrange

    const record = makeRecord({ state: "structured" });

    await db.table("workouts").put(record);
    useWorkoutStore.setState({ currentWorkout: EDITED_KRD });

    const { result } = renderHook(() => useEditorActions(record));
    await act(async () => {
      await result.current.pushWorkout("garmin-abc");
    });

    // Act

    const persisted = await loadPersisted(record.id);

    // Assert

    expect(persisted?.state).toBe("pushed");
    expect(persisted?.krd).toEqual(EDITED_KRD);
    expect(persisted?.modifiedAt).not.toBeNull();
  });

  it("should NOT bump modifiedAt via pushWorkout on STRUCTURED without edits", async () => {
    // Arrange

    const record = makeRecord({ state: "structured" });

    await db.table("workouts").put(record);
    // currentWorkout matches the record's KRD — no edit.
    useWorkoutStore.setState({ currentWorkout: ORIGINAL_KRD });

    const { result } = renderHook(() => useEditorActions(record));
    await act(async () => {
      await result.current.pushWorkout("garmin-abc");
    });

    // Act

    const persisted = await loadPersisted(record.id);

    // Assert

    expect(persisted?.state).toBe("pushed");
    expect(persisted?.modifiedAt).toBeNull();
  });

  it("should bump modifiedAt via pushWorkout on READY with edits", async () => {
    // Arrange

    const record = makeRecord({ state: "ready", krd: ORIGINAL_KRD });

    await db.table("workouts").put(record);
    useWorkoutStore.setState({ currentWorkout: EDITED_KRD });

    const { result } = renderHook(() => useEditorActions(record));
    await act(async () => {
      await result.current.pushWorkout("garmin-xyz");
    });

    // Act

    const persisted = await loadPersisted(record.id);

    // Assert

    expect(persisted?.state).toBe("pushed");
    expect(persisted?.garminPushId).toBe("garmin-xyz");
    expect(persisted?.krd).toEqual(EDITED_KRD);
    expect(persisted?.modifiedAt).not.toBeNull();
  });

  it("should persist a re-created library id on an already-pushed record without throwing", async () => {
    // Arrange
    const record = makeRecord({
      state: "pushed",
      krd: ORIGINAL_KRD,
      garminPushId: "garmin-1",
    });
    await db.table("workouts").put(record);
    useWorkoutStore.setState({ currentWorkout: ORIGINAL_KRD });
    const { result } = renderHook(() => useEditorActions(record));

    // Act
    await act(async () => {
      await result.current.pushWorkout("garmin-2");
    });

    // Assert
    const persisted = await loadPersisted(record.id);
    expect(persisted?.state).toBe("pushed");
    expect(persisted?.garminPushId).toBe("garmin-2");
  });
});

describe("useEditorActions — open editor during a coach move (R11)", () => {
  beforeEach(async () => {
    await db.table("workouts").clear();
    useWorkoutStore.setState({ currentWorkout: null });
  });

  it("should save the coach's date when the coach moved the open workout", async () => {
    // Arrange
    const opened = makeRecord({ state: "ready", coachDate: "2026-04-20" });
    const { result, rerender } = renderHook(
      ({ record }) => useEditorActions(record),
      { initialProps: { record: opened } }
    );
    const coachMoved = {
      ...opened,
      date: "2026-04-22",
      coachDate: "2026-04-22",
    };
    await db.table("workouts").put(coachMoved);
    rerender({ record: coachMoved });

    // Act
    await act(async () => {
      await result.current.pushWorkout("garmin-1");
    });

    // Assert
    expect((await loadPersisted(opened.id))?.date).toBe("2026-04-22");
  });

  it("should keep the coach's move that lands before the editor re-renders", async () => {
    // Arrange
    const opened = makeRecord({ state: "ready", coachDate: "2026-04-20" });
    await db.table("workouts").put(opened);
    const { result } = renderHook(() => useEditorActions(opened));
    await db
      .table("workouts")
      .put({ ...opened, date: "2026-04-22", coachDate: "2026-04-22" });

    // Act
    await act(async () => {
      await result.current.pushWorkout("garmin-1");
    });

    // Assert
    expect(await loadPersisted(opened.id)).toMatchObject({
      date: "2026-04-22",
      coachDate: "2026-04-22",
      state: "pushed",
      garminPushId: "garmin-1",
    });
  });

  it("should not recreate a workout deleted before the send finished", async () => {
    // Arrange
    const opened = makeRecord({ state: "ready" });
    const { result } = renderHook(() => useEditorActions(opened));

    // Act
    await act(async () => {
      await result.current.pushWorkout("garmin-1");
    });

    // Assert
    expect(await loadPersisted(opened.id)).toBeUndefined();
  });
});
