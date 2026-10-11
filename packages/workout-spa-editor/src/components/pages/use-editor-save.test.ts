/**
 * The editor's save cycle on a scheduled workout, against fake-indexeddb:
 * load → edit in the store → Save → the draft is clean and `beforeunload`
 * no longer prompts; Discard reloads the baseline into the store.
 */
import "fake-indexeddb/auto";

import { act, renderHook, waitFor } from "@testing-library/react";
import { createElement, type ReactNode } from "react";
import { beforeEach, describe, expect, it } from "vitest";

import { createAppPersistence } from "../../adapters/create-app-persistence";
import { db } from "../../adapters/dexie/dexie-database";
import { PersistenceProvider } from "../../contexts/persistence-context";
import { ToastContextProvider } from "../../contexts/ToastContext";
import { useWorkoutStore } from "../../store/workout-store";
import type { WorkoutRecord } from "../../types/calendar-record";
import type { KRD } from "../../types/krd";
import { useEditorActions } from "./use-editor-actions";
import { useEditorSave } from "./use-editor-save";
import { useWorkoutRecord } from "./use-workout-record";

const ID = "550e8400-e29b-41d4-a716-446655440066";
const step = (stepIndex: number) => ({
  stepIndex,
  durationType: "time",
  duration: { type: "time", seconds: 600 },
  targetType: "open",
  target: { type: "open" },
  intensity: "active",
});
const KRD_ONE_STEP = {
  version: "1.0",
  type: "structured_workout",
  metadata: { created: "2026-10-01T08:00:00Z", sport: "running" },
  extensions: {
    structured_workout: { name: "Tempo", sport: "running", steps: [step(0)] },
  },
} as unknown as KRD;

const record = (): WorkoutRecord =>
  ({
    id: ID,
    profileId: "p1",
    date: "2026-10-05",
    sport: "running",
    source: "scratch",
    sourceId: null,
    planId: null,
    state: "structured",
    raw: null,
    krd: KRD_ONE_STEP,
    lastProcessingError: null,
    feedback: null,
    aiMeta: null,
    garminPushId: null,
    tags: [],
    previousState: null,
    createdAt: "2026-10-01T08:00:00.000Z",
    modifiedAt: null,
    updatedAt: "2026-10-01T08:00:00.000Z",
  }) as WorkoutRecord;

const wrapper = ({ children }: { children: ReactNode }) =>
  createElement(PersistenceProvider, {
    persistence: createAppPersistence(db),
    children: createElement(ToastContextProvider, null, children),
  });

const useEditor = () => {
  const loaded = useWorkoutRecord(ID);
  const { saveEdits } = useEditorActions(loaded.record);
  return { loaded, ...useEditorSave(saveEdits, loaded) };
};

const stepCount = () =>
  (
    useWorkoutStore.getState().currentWorkout?.extensions
      ?.structured_workout as { steps: unknown[] } | undefined
  )?.steps.length;

const renderLoaded = async () => {
  const view = renderHook(useEditor, { wrapper });
  await waitFor(() =>
    expect(view.result.current.loaded.baselineKrd).not.toBe(null)
  );
  return view;
};

const prompts = () => {
  const event = new Event("beforeunload", { cancelable: true });
  window.dispatchEvent(event);
  return event.defaultPrevented;
};

describe("useEditorSave", () => {
  beforeEach(async () => {
    useWorkoutStore.getState().clearWorkout();
    await db.table("workouts").clear();
    await db.table("workouts").put(record());
  });

  it("should be clean after Save and stop guarding the page unload", async () => {
    // Arrange
    const { result } = await renderLoaded();
    act(() => useWorkoutStore.getState().createStep());
    await waitFor(() => expect(result.current.isDirty).toBe(true));
    const guardedWhileDirty = prompts();

    // Act
    await act(() => result.current.save());

    // Assert
    expect(guardedWhileDirty).toBe(true);
    expect(result.current.isDirty).toBe(false);
    expect(prompts()).toBe(false);
    const saved = await db.table<WorkoutRecord>("workouts").get(ID);
    const steps = (
      saved?.krd?.extensions?.structured_workout as { steps: unknown[] }
    ).steps;
    expect(steps).toHaveLength(2);
  });

  it("should reload the baseline into the store on Discard", async () => {
    // Arrange
    const { result } = await renderLoaded();
    act(() => useWorkoutStore.getState().createStep());
    await waitFor(() => expect(stepCount()).toBe(2));

    // Act
    act(() => result.current.discard());

    // Assert
    expect(stepCount()).toBe(1);
    expect(result.current.isDirty).toBe(false);
    const stored = await db.table<WorkoutRecord>("workouts").get(ID);
    expect(stored?.modifiedAt).toBeNull();
  });
});
