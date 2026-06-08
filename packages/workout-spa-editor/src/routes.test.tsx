import { waitFor } from "@testing-library/react";
import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import { Router } from "wouter";
import { memoryLocation } from "wouter/memory-location";

import App from "./App";
import { ToastProvider } from "./components/atoms/Toast";
import { GarminBridgeProvider } from "./contexts/garmin-bridge-context";
import { PersistenceProvider } from "./contexts/persistence-context";
import { ThemeProvider } from "./contexts/ThemeContext";
import { ToastContextProvider } from "./contexts/ToastContext";
import { useWorkoutStore } from "./store/workout-store";
import { createInMemoryPersistence } from "./test-utils/in-memory-persistence";
import { TestSyncProvider } from "./test-utils/sync-test-provider";

function renderAtPath(path: string) {
  const location = memoryLocation({ path, record: true });
  const { hook } = location;

  const view = render(
    <ThemeProvider>
      <PersistenceProvider persistence={createInMemoryPersistence()}>
        <TestSyncProvider>
          <GarminBridgeProvider>
            <ToastProvider>
              <ToastContextProvider>
                <Router hook={hook}>
                  <App />
                </Router>
              </ToastContextProvider>
            </ToastProvider>
          </GarminBridgeProvider>
        </TestSyncProvider>
      </PersistenceProvider>
    </ThemeProvider>
  );
  return { ...view, location };
}

describe("Routing", () => {
  beforeEach(() => {
    useWorkoutStore.setState({
      currentWorkout: null,
      undoHistory: [],
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

  it("should render the Today page at /today", async () => {
    // Arrange

    // Act

    renderAtPath("/today");

    // Assert

    expect(await screen.findByTestId("daily-page")).toBeInTheDocument();
  });

  it("should redirect bare /calendar to the current week's grid in one hop", async () => {
    // Arrange

    // Act

    const { location } = renderAtPath("/calendar");

    // Assert

    await waitFor(() => {
      expect(location.history.at(-1)).toMatch(/^\/calendar\/\d{4}-W\d{2}$/);
    });
    // 1-hop: bare /calendar never rests in the history (replace redirect).
    expect(location.history.filter((p) => p === "/calendar")).toHaveLength(0);
  });

  it("should render LibraryPage at /library", async () => {
    // Arrange

    // Act

    renderAtPath("/library");

    // Assert

    expect(await screen.findByTestId("library-page")).toBeInTheDocument();
  });

  it("should render the Create overlay at /workout/new", async () => {
    // Arrange

    // Act

    renderAtPath("/workout/new");

    // Assert

    await waitFor(() => {
      expect(screen.getByTestId("create-workout")).toBeInTheDocument();
    });
  });

  it("should redirect / to the current week's calendar", async () => {
    // Arrange

    // Act

    const { location } = renderAtPath("/");

    // Assert

    await waitFor(() => {
      expect(location.history.at(-1)).toMatch(/^\/calendar\/\d{4}-W\d{2}$/);
    });
  });

  it("should redirect unknown routes to the current week's calendar", async () => {
    // Arrange

    // Act

    const { location } = renderAtPath("/nonexistent");

    // Assert

    await waitFor(() => {
      expect(location.history.at(-1)).toMatch(/^\/calendar\/\d{4}-W\d{2}$/);
    });
  });

  it("should render CalendarPage with weekId param", async () => {
    // Arrange

    // Act

    renderAtPath("/calendar/2026-W15");

    // Assert

    await waitFor(() => {
      expect(screen.getByTestId("calendar-page")).toBeInTheDocument();
    });
  });
});
