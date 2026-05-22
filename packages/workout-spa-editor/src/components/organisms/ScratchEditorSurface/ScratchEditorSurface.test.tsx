import { render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { Router } from "wouter";
import { memoryLocation } from "wouter/memory-location";

import { db } from "../../../adapters/dexie/dexie-database";
import { createDexiePersistence } from "../../../adapters/dexie/dexie-persistence-adapter";
import { GarminBridgeProvider } from "../../../contexts/garmin-bridge-context";
import { PersistenceProvider } from "../../../contexts/persistence-context";
import { ToastContextProvider } from "../../../contexts/ToastContext";
import { useWorkoutStore } from "../../../store/workout-store";
import { ToastProvider } from "../../atoms/Toast";
import { ScratchEditorSurface } from "./ScratchEditorSurface";

function renderSurface() {
  const { hook } = memoryLocation({
    path: "/workout/new?source=scratch",
    record: true,
  });
  return render(
    <PersistenceProvider persistence={createDexiePersistence(db)}>
      <GarminBridgeProvider>
        <ToastProvider>
          <ToastContextProvider>
            <Router hook={hook}>
              <ScratchEditorSurface />
            </Router>
          </ToastContextProvider>
        </ToastProvider>
      </GarminBridgeProvider>
    </PersistenceProvider>
  );
}

describe("ScratchEditorSurface", () => {
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

  it("should seed an empty cycling workout when currentWorkout is null", async () => {
    // Arrange

    // Act

    renderSurface();

    // Assert

    await waitFor(() => {
      const state = useWorkoutStore.getState();
      expect(state.currentWorkout?.extensions?.structured_workout?.sport).toBe(
        "cycling"
      );
    });
  });

  it("should render the AI banner closed and the metadata editor open", async () => {
    // Arrange

    // Act

    renderSurface();

    // Assert

    await waitFor(() => {
      expect(screen.getByTestId("ai-banner")).toBeInTheDocument();
    });
    expect(
      screen.getByRole("button", { name: /generate with ai/i })
    ).toHaveAttribute("aria-expanded", "false");
    expect(
      await screen.findByRole("form", { name: /edit workout metadata/i })
    ).toBeInTheDocument();
  });

  it("should NOT overwrite a pre-populated currentWorkout (library template path)", async () => {
    // Arrange

    const seeded = {
      version: "1.0",
      type: "structured_workout" as const,
      metadata: { created: "2026-01-01T00:00:00Z", sport: "running" },
      extensions: {
        structured_workout: {
          name: "Template Run",
          sport: "running" as const,
          steps: [],
        },
      },
    };
    useWorkoutStore.getState().loadWorkout(seeded);

    // Act

    renderSurface();

    // Assert

    await waitFor(() => {
      expect(screen.getByTestId("ai-banner")).toBeInTheDocument();
    });
    const after = useWorkoutStore.getState();
    expect(after.currentWorkout?.extensions?.structured_workout?.name).toBe(
      "Template Run"
    );
    expect(after.currentWorkout?.extensions?.structured_workout?.sport).toBe(
      "running"
    );
  });

  it("should NOT write to Dexie on mount (persistence happens on save only)", async () => {
    // Arrange

    const put = vi.spyOn(db.table("workouts"), "put");

    // Act

    renderSurface();

    // Assert

    await waitFor(() => {
      expect(useWorkoutStore.getState().currentWorkout).not.toBeNull();
    });
    expect(put).not.toHaveBeenCalled();
  });
});
