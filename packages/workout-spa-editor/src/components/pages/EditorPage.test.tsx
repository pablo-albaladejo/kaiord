/**
 * EditorPage Integration Tests
 *
 * Tests for:
 * - Load workout from calendar by ID
 * - Accept structured workout (structured -> ready)
 * - Push ready workout (ready -> pushed)
 * - Edit pushed workout (pushed -> modified)
 * - Re-push modified workout (modified -> pushed)
 */

import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";
import { Router } from "wouter";
import { memoryLocation } from "wouter/memory-location";

import { db } from "../../adapters/dexie/dexie-database";
import { GarminBridgeProvider, SettingsDialogProvider } from "../../contexts";
import { ToastContextProvider } from "../../contexts/ToastContext";
import { useWorkoutStore } from "../../store/workout-store";
import type { WorkoutRecord } from "../../types/calendar-record";
import { ToastProvider } from "../atoms/Toast";
import EditorPage from "./EditorPage";

const testKrd = {
  version: "1.0",
  type: "structured_workout" as const,
  metadata: { created: "2026-01-01T00:00:00Z", sport: "cycling" },
  extensions: {
    structured_workout: {
      name: "Test Workout",
      sport: "cycling",
      steps: [],
    },
  },
};

function makeRecord(overrides: Partial<WorkoutRecord> = {}): WorkoutRecord {
  return {
    id: "w-test",
    date: "2026-04-06",
    sport: "cycling",
    source: "kaiord",
    sourceId: null,
    planId: null,
    state: "structured",
    raw: null,
    krd: testKrd,
    lastProcessingError: null,
    feedback: null,
    aiMeta: null,
    garminPushId: null,
    tags: [],
    previousState: null,
    createdAt: "2026-04-06T08:00:00.000Z",
    modifiedAt: null,
    updatedAt: "2026-04-06T08:00:00.000Z",
    ...overrides,
  };
}

function renderEditor(id?: string) {
  const path = id ? `/workout/${id}` : "/workout/new";
  const { hook } = memoryLocation({ path, record: true });
  return render(
    <SettingsDialogProvider>
      <GarminBridgeProvider>
        <ToastProvider>
          <ToastContextProvider>
            <Router hook={hook}>
              <EditorPage id={id} />
            </Router>
          </ToastContextProvider>
        </ToastProvider>
      </GarminBridgeProvider>
    </SettingsDialogProvider>
  );
}

describe("EditorPage", () => {
  beforeEach(async () => {
    await db.table("workouts").clear();
    useWorkoutStore.setState({
      currentWorkout: null,
      workoutHistory: [],
      historyIndex: -1,
      selectedStepId: null,
      selectedStepIds: [],
      isEditing: false,
    });
  });

  it("loads workout from Dexie by ID", async () => {
    await db.table("workouts").add(makeRecord());

    renderEditor("w-test");

    await waitFor(() => {
      expect(screen.getByTestId("workflow-bar")).toBeInTheDocument();
    });
    expect(
      screen.getByRole("button", { name: /accept workout/i })
    ).toBeInTheDocument();
  });

  it("shows no-data message for workout without KRD", async () => {
    await db.table("workouts").add(makeRecord({ krd: null }));

    renderEditor("w-test");

    await waitFor(() => {
      expect(
        screen.getByText("This workout has no structured data yet.")
      ).toBeInTheDocument();
    });
  });

  it("accept transitions structured -> ready", async () => {
    const user = userEvent.setup();
    await db.table("workouts").add(makeRecord({ state: "structured" }));

    renderEditor("w-test");

    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: /accept workout/i })
      ).toBeInTheDocument();
    });

    await user.click(screen.getByRole("button", { name: /accept workout/i }));

    await waitFor(async () => {
      const record = await db.table("workouts").get("w-test");
      expect(record.state).toBe("ready");
    });
  });

  it("push transitions ready -> pushed", async () => {
    const user = userEvent.setup();
    await db.table("workouts").add(makeRecord({ state: "ready" }));

    renderEditor("w-test");

    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: /push to garmin/i })
      ).toBeInTheDocument();
    });

    await user.click(screen.getByRole("button", { name: /push to garmin/i }));

    await waitFor(async () => {
      const record = await db.table("workouts").get("w-test");
      expect(record.state).toBe("pushed");
      expect(record.garminPushId).toBeTruthy();
    });
  });

  it("shows modified indicator for modified workouts", async () => {
    await db.table("workouts").add(
      makeRecord({
        state: "modified",
        modifiedAt: "2026-04-06T12:00:00.000Z",
      })
    );

    renderEditor("w-test");

    await waitFor(() => {
      expect(screen.getByTestId("modified-indicator")).toBeInTheDocument();
    });
    expect(
      screen.getByRole("button", { name: /re-push to garmin/i })
    ).toBeInTheDocument();
  });

  it("re-push transitions modified -> pushed", async () => {
    const user = userEvent.setup();
    await db.table("workouts").add(
      makeRecord({
        state: "modified",
        modifiedAt: "2026-04-06T12:00:00.000Z",
      })
    );

    renderEditor("w-test");

    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: /re-push to garmin/i })
      ).toBeInTheDocument();
    });

    await user.click(
      screen.getByRole("button", { name: /re-push to garmin/i })
    );

    await waitFor(async () => {
      const record = await db.table("workouts").get("w-test");
      expect(record.state).toBe("pushed");
    });
  });
});
