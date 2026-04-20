/**
 * Verifies that edits persisted from STRUCTURED and READY states bump
 * `modifiedAt` on the underlying WorkoutRecord — per
 * spa-workout-state-machine §"STALE detection" ("modifiedAt SHALL be
 * updated on any user edit to the KRD, not only on PUSHED→MODIFIED
 * transitions").
 *
 * Exercises `useEditorActions` against an in-memory Dexie (fake-
 * indexeddb) and a pre-seeded workout-store to simulate the flow:
 *   load → edit in Zustand → accept/push → persist.
 */

import "fake-indexeddb/auto";
import { renderHook, act } from "@testing-library/react";
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

  it("acceptWorkout on STRUCTURED with edits bumps modifiedAt", async () => {
    const record = makeRecord({ state: "structured" });
    useWorkoutStore.setState({ currentWorkout: EDITED_KRD });

    const { result } = renderHook(() => useEditorActions(record));
    await act(async () => {
      await result.current.acceptWorkout();
    });

    const persisted = await loadPersisted(record.id);
    expect(persisted?.state).toBe("ready");
    expect(persisted?.krd).toEqual(EDITED_KRD);
    expect(persisted?.modifiedAt).not.toBeNull();
  });

  it("acceptWorkout on STRUCTURED without edits does NOT bump modifiedAt", async () => {
    const record = makeRecord({ state: "structured" });
    // currentWorkout matches the record's KRD — no edit.
    useWorkoutStore.setState({ currentWorkout: ORIGINAL_KRD });

    const { result } = renderHook(() => useEditorActions(record));
    await act(async () => {
      await result.current.acceptWorkout();
    });

    const persisted = await loadPersisted(record.id);
    expect(persisted?.state).toBe("ready");
    expect(persisted?.modifiedAt).toBeNull();
  });

  it("pushWorkout on READY with edits bumps modifiedAt", async () => {
    const record = makeRecord({ state: "ready", krd: ORIGINAL_KRD });
    useWorkoutStore.setState({ currentWorkout: EDITED_KRD });

    const { result } = renderHook(() => useEditorActions(record));
    await act(async () => {
      await result.current.pushWorkout("garmin-xyz");
    });

    const persisted = await loadPersisted(record.id);
    expect(persisted?.state).toBe("pushed");
    expect(persisted?.garminPushId).toBe("garmin-xyz");
    expect(persisted?.krd).toEqual(EDITED_KRD);
    expect(persisted?.modifiedAt).not.toBeNull();
  });

  it("markModified on PUSHED bumps modifiedAt (regression check)", async () => {
    const record = makeRecord({
      state: "pushed",
      krd: ORIGINAL_KRD,
      garminPushId: "garmin-1",
    });
    useWorkoutStore.setState({ currentWorkout: EDITED_KRD });

    const { result } = renderHook(() => useEditorActions(record));
    await act(async () => {
      await result.current.markModified(EDITED_KRD);
    });

    const persisted = await loadPersisted(record.id);
    expect(persisted?.state).toBe("modified");
    expect(persisted?.modifiedAt).not.toBeNull();
  });
});
