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
import { createDexiePersistence } from "../../adapters/dexie/dexie-persistence-adapter";
import { GarminBridgeProvider } from "../../contexts/garmin-bridge-context";
import { PersistenceProvider } from "../../contexts/persistence-context";
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

function renderEditor(id?: string, path?: string) {
  const resolvedPath = path ?? (id ? `/workout/${id}` : "/workout/new");
  const { hook } = memoryLocation({ path: resolvedPath, record: true });
  return render(
    <PersistenceProvider persistence={createDexiePersistence(db)}>
      <GarminBridgeProvider>
        <ToastProvider>
          <ToastContextProvider>
            <Router hook={hook}>
              <EditorPage id={id} />
            </Router>
          </ToastContextProvider>
        </ToastProvider>
      </GarminBridgeProvider>
    </PersistenceProvider>
  );
}

describe("EditorPage", () => {
  beforeEach(async () => {
    await db.table("workouts").clear();
    useWorkoutStore.setState({
      currentWorkout: null,
      undoHistory: [],
      historyIndex: -1,
      selectedStepId: null,
      selectedStepIds: [],
      isEditing: false,
    });
  });

  it("should load workout from Dexie by ID", async () => {
    // Arrange

    await db.table("workouts").add(makeRecord());

    // Act

    renderEditor("w-test");

    // Assert

    await waitFor(() => {
      expect(screen.getByTestId("workflow-bar")).toBeInTheDocument();
    });
    expect(
      screen.getByRole("button", { name: /accept workout/i })
    ).toBeInTheDocument();
  });

  it("should show no-data message for workout without KRD", async () => {
    // Arrange

    await db.table("workouts").add(makeRecord({ krd: null }));

    // Act

    renderEditor("w-test");

    // Assert

    await waitFor(() => {
      expect(
        screen.getByText("This workout has no structured data yet.")
      ).toBeInTheDocument();
    });
  });

  it("should transition structured -> ready on accept", async () => {
    // Arrange

    const user = userEvent.setup();
    await db.table("workouts").add(makeRecord({ state: "structured" }));

    // Act

    renderEditor("w-test");

    // Assert

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

  it("should transition ready -> pushed on push", async () => {
    // Arrange

    const user = userEvent.setup();
    await db.table("workouts").add(makeRecord({ state: "ready" }));

    // Act

    renderEditor("w-test");

    // Assert

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

  it("should show modified indicator for modified workouts", async () => {
    // Arrange

    await db.table("workouts").add(
      makeRecord({
        state: "modified",
        modifiedAt: "2026-04-06T12:00:00.000Z",
      })
    );

    // Act

    renderEditor("w-test");

    // Assert

    await waitFor(() => {
      expect(screen.getByTestId("modified-indicator")).toBeInTheDocument();
    });
    expect(
      screen.getByRole("button", { name: /re-push to garmin/i })
    ).toBeInTheDocument();
  });

  it("should transition modified -> pushed on re-push", async () => {
    // Arrange

    const user = userEvent.setup();
    await db.table("workouts").add(
      makeRecord({
        state: "modified",
        modifiedAt: "2026-04-06T12:00:00.000Z",
      })
    );

    // Act

    renderEditor("w-test");

    // Assert

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

  it("should mount the ImportDropzoneOverlay when navigated with ?action=import", async () => {
    // Arrange

    // Act

    renderEditor(undefined, "/workout/new?action=import");

    // Assert

    await waitFor(() => {
      expect(screen.getByTestId("import-dropzone-overlay")).toBeInTheDocument();
    });
    const input = document.querySelector(
      'input[type="file"]'
    ) as HTMLInputElement | null;
    expect(input).not.toBeNull();
  });

  it("should render AiBanner closed and the editor in MetadataEditMode when mounted with ?source=scratch", async () => {
    // Arrange

    // Act

    renderEditor(undefined, "/workout/new?source=scratch");

    // Assert

    await waitFor(() => {
      expect(screen.getByTestId("ai-banner")).toBeInTheDocument();
    });
    expect(
      screen.getByRole("button", { name: /generate with ai/i })
    ).toHaveAttribute("aria-expanded", "false");
    await waitFor(() => {
      expect(
        screen.getByRole("form", { name: /edit workout metadata/i })
      ).toBeInTheDocument();
    });
    expect(
      screen.queryByRole("heading", { name: /getting started/i })
    ).toBeNull();
    expect(screen.queryByText(/or create manually/i)).toBeNull();
  });
});
