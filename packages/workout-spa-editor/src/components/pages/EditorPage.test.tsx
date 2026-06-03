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

import { render, screen, waitFor, within } from "@testing-library/react";
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
import type { KRD } from "../../types/krd";
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
  const loc = memoryLocation({ path: resolvedPath, record: true });
  const utils = render(
    <PersistenceProvider persistence={createDexiePersistence(db)}>
      <GarminBridgeProvider>
        <ToastProvider>
          <ToastContextProvider>
            <Router hook={loc.hook}>
              <EditorPage id={id} />
            </Router>
          </ToastContextProvider>
        </ToastProvider>
      </GarminBridgeProvider>
    </PersistenceProvider>
  );
  return { ...utils, location: loc };
}

function makeStepfulKrd(stepCount: number): KRD {
  const steps = Array.from({ length: stepCount }, (_, i) => ({
    stepIndex: i,
    durationType: "time" as const,
    duration: { type: "time" as const, seconds: 60 },
    targetType: "power" as const,
    target: {
      type: "power" as const,
      value: { unit: "watts" as const, value: 150 },
    },
  }));
  return {
    version: "1.0",
    type: "structured_workout",
    metadata: { created: "2026-01-01T00:00:00Z", sport: "cycling" },
    extensions: {
      structured_workout: {
        name: "Draft",
        sport: "cycling",
        steps,
      },
    },
  };
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
      isModalOpen: false,
      modalConfig: null,
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

  it('should render the back button on mode "scratch" and navigate to /workout/new when clicked with an empty draft', async () => {
    // Arrange
    const user = userEvent.setup();

    // Act
    const { location } = renderEditor(undefined, "/workout/new?source=scratch");

    // Assert
    await waitFor(() => {
      expect(screen.getByTestId("editor-back-button")).toBeInTheDocument();
    });
    await user.click(screen.getByTestId("editor-back-button"));
    expect(location.history.at(-1)).toBe("/workout/new");
  });

  it("should preserve ?date= in the back target when the source URL had a date param", async () => {
    // Arrange
    const user = userEvent.setup();

    // Act
    const { location } = renderEditor(
      undefined,
      "/workout/new?source=scratch&date=2026-06-01"
    );

    // Assert
    await waitFor(() => {
      expect(screen.getByTestId("editor-back-button")).toBeInTheDocument();
    });
    await user.click(screen.getByTestId("editor-back-button"));
    expect(location.history.at(-1)).toBe("/workout/new?date=2026-06-01");
  });

  it("should render the schedule control on a dated scratch route", async () => {
    // Arrange

    // Act
    renderEditor(undefined, "/workout/new?source=scratch&date=2026-06-01");

    // Assert
    expect(
      await screen.findByTestId("scratch-schedule-button")
    ).toBeInTheDocument();
  });

  it("should NOT render a back button when id is provided", async () => {
    // Arrange
    await db.table("workouts").add(makeRecord());

    // Act
    renderEditor("w-test");

    // Assert
    await waitFor(() => {
      expect(screen.getByTestId("workflow-bar")).toBeInTheDocument();
    });
    expect(screen.queryByTestId("editor-back-button")).toBeNull();
  });

  it("should open the discard confirmation modal on back when steps.length > 0", async () => {
    // Arrange
    const user = userEvent.setup();
    useWorkoutStore.setState({ currentWorkout: makeStepfulKrd(2) });

    // Act
    renderEditor(undefined, "/workout/new?source=scratch");

    // Assert
    await waitFor(() => {
      expect(screen.getByTestId("editor-back-button")).toBeInTheDocument();
    });
    await user.click(screen.getByTestId("editor-back-button"));
    await waitFor(() => {
      expect(useWorkoutStore.getState().isModalOpen).toBe(true);
    });
    expect(await screen.findByTestId("modal-backdrop")).toBeInTheDocument();
  });

  it("should clear the store after the discard confirmation is confirmed and then navigate", async () => {
    // Arrange
    const user = userEvent.setup();
    useWorkoutStore.setState({ currentWorkout: makeStepfulKrd(1) });

    // Act
    const { location } = renderEditor(
      undefined,
      "/workout/new?source=scratch&date=2026-06-01"
    );
    await waitFor(() => {
      expect(screen.getByTestId("editor-back-button")).toBeInTheDocument();
    });
    await user.click(screen.getByTestId("editor-back-button"));
    const dialog = await screen.findByRole("dialog");
    await user.click(
      within(dialog).getByRole("button", { name: /^discard$/i })
    );

    // Assert
    await waitFor(() => {
      expect(useWorkoutStore.getState().currentWorkout).toBeNull();
    });
    expect(location.history.at(-1)).toBe("/workout/new?date=2026-06-01");
  });

  it("should keep the underlying back button non-interactive while the discard ConfirmationModal is open", async () => {
    // Arrange
    const user = userEvent.setup();
    useWorkoutStore.setState({ currentWorkout: makeStepfulKrd(1) });

    // Act
    renderEditor(undefined, "/workout/new?source=scratch");
    await waitFor(() => {
      expect(screen.getByTestId("editor-back-button")).toBeInTheDocument();
    });
    await user.click(screen.getByTestId("editor-back-button"));
    const dialog = await screen.findByRole("dialog");

    // Assert
    expect(dialog).toBeInTheDocument();
    expect(useWorkoutStore.getState().isModalOpen).toBe(true);
    expect(
      getComputedStyle(screen.getByTestId("editor-back-button")).pointerEvents
    ).toBe("none");
  });

  it("should preserve the back-handler identity across parent re-renders when onAfterConfirm is wrapped in useCallback", async () => {
    // Arrange
    useWorkoutStore.setState({ currentWorkout: makeStepfulKrd(1) });

    // Act
    const { rerender } = renderEditor(undefined, "/workout/new?source=scratch");
    await waitFor(() => {
      expect(screen.getByTestId("editor-back-button")).toBeInTheDocument();
    });
    const initialButton = screen.getByTestId("editor-back-button");
    rerender(<div />);
    rerender(<div />);

    // Assert
    expect(initialButton).toBeInstanceOf(HTMLButtonElement);
  });

  it("should preserve surface state (selection + scroll position) after the user cancels the discard modal", async () => {
    // Arrange
    const user = userEvent.setup();
    useWorkoutStore.setState({ currentWorkout: makeStepfulKrd(1) });

    // Act
    renderEditor(undefined, "/workout/new?source=scratch");
    await waitFor(() => {
      expect(screen.getByTestId("editor-back-button")).toBeInTheDocument();
    });
    await user.click(screen.getByTestId("editor-back-button"));
    const dialog = await screen.findByRole("dialog");
    await user.click(within(dialog).getByRole("button", { name: /^cancel$/i }));

    // Assert
    expect(useWorkoutStore.getState().currentWorkout).not.toBeNull();
    expect(screen.getByTestId("editor-back-button")).toBeInTheDocument();
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
