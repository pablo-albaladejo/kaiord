import { waitFor } from "@testing-library/react";
import { render } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import { Router } from "wouter";
import { memoryLocation } from "wouter/memory-location";

import App from "./App";
import { ToastProvider } from "./components/atoms/Toast";
import {
  GarminBridgeProvider,
  SettingsDialogProvider,
  ThemeProvider,
} from "./contexts";
import { ToastContextProvider } from "./contexts/ToastContext";
import { useWorkoutStore } from "./store/workout-store";
import { screen } from "./test-utils";

function renderAtPath(path: string) {
  const { hook } = memoryLocation({ path, record: true });

  return render(
    <ThemeProvider>
      <SettingsDialogProvider>
        <GarminBridgeProvider>
          <ToastProvider>
            <ToastContextProvider>
              <Router hook={hook}>
                <App />
              </Router>
            </ToastContextProvider>
          </ToastProvider>
        </GarminBridgeProvider>
      </SettingsDialogProvider>
    </ThemeProvider>
  );
}

describe("Routing", () => {
  beforeEach(() => {
    useWorkoutStore.setState({
      currentWorkout: null,
      workoutHistory: [],
      historyIndex: -1,
      selectedStepId: null,
      selectedStepIds: [],
      isEditing: false,
      safeMode: false,
      lastBackup: null,
      deletedSteps: [],
    });
    localStorage.clear();
    localStorage.setItem("workout-spa-onboarding-completed", "true");
  });

  it("renders CalendarPage at /calendar", async () => {
    renderAtPath("/calendar");

    await waitFor(() => {
      expect(screen.getByText("Calendar (coming soon)")).toBeInTheDocument();
    });
  });

  it("renders LibraryPage at /library", async () => {
    renderAtPath("/library");

    await waitFor(() => {
      expect(screen.getByText("Library (coming soon)")).toBeInTheDocument();
    });
  });

  it("renders EditorPage at /workout/new", async () => {
    renderAtPath("/workout/new");

    // EditorPage lazy-loads; first we may see the spinner, then content
    await waitFor(
      () => {
        const container = document.querySelector(".space-y-6");
        expect(container).toBeInTheDocument();
      },
      { timeout: 5000 }
    );
  });

  it("redirects / to /calendar", async () => {
    renderAtPath("/");

    await waitFor(() => {
      expect(screen.getByText("Calendar (coming soon)")).toBeInTheDocument();
    });
  });

  it("redirects unknown routes to /calendar", async () => {
    renderAtPath("/nonexistent");

    await waitFor(() => {
      expect(screen.getByText("Calendar (coming soon)")).toBeInTheDocument();
    });
  });

  it("renders CalendarPage with weekId param", async () => {
    renderAtPath("/calendar/2026-W15");

    await waitFor(() => {
      expect(screen.getByText("Calendar (coming soon)")).toBeInTheDocument();
    });
  });
});
