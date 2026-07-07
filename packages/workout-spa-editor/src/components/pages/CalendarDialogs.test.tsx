import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { Router } from "wouter";
import { memoryLocation } from "wouter/memory-location";

import { activityToWorkoutRecord } from "../../application/coaching/activity-to-workout-record";
import { CoachingRegistryProvider } from "../../contexts/coaching-registry-context";
import { GarminBridgeProvider } from "../../contexts/garmin-bridge-context";
import { PersistenceProvider } from "../../contexts/persistence-context";
import { createInMemoryPersistence } from "../../test-utils/in-memory-persistence";
import { buildSourceActivityRecord } from "../../types/activity-record";
import type { WorkoutRecord } from "../../types/calendar-record";
import { AppToastProvider } from "../providers/AppToastProvider";
import { CalendarDialogs } from "./CalendarDialogs";

const rawWorkout: WorkoutRecord = {
  id: "w-raw",
  profileId: "p1",
  date: "2026-04-06",
  sport: "running",
  source: "kaiord",
  sourceId: null,
  planId: null,
  state: "raw",
  raw: {
    title: "Easy run",
    description: "",
    comments: [],
    distance: null,
    duration: null,
    prescribedRpe: null,
    rawHash: "abc",
  },
  krd: null,
  lastProcessingError: null,
  feedback: null,
  aiMeta: null,
  garminPushId: null,
  tags: [],
  previousState: null,
  createdAt: "2026-04-06T00:00:00.000Z",
  modifiedAt: null,
  updatedAt: "2026-04-06T00:00:00.000Z",
};

const projectedWorkout = () =>
  activityToWorkoutRecord(
    buildSourceActivityRecord({
      profileId: "p1",
      date: "2026-04-06",
      sport: "running",
      sourceBridgeId: "garmin-bridge",
      externalId: "ext-1",
    })
  );

function renderDialogs(selectedWorkout: WorkoutRecord | null) {
  const { hook } = memoryLocation({ path: "/calendar", record: true });
  return render(
    <PersistenceProvider persistence={createInMemoryPersistence()}>
      <GarminBridgeProvider>
        <CoachingRegistryProvider factories={[]}>
          <AppToastProvider>
            <Router hook={hook}>
              <CalendarDialogs
                selectedWorkout={selectedWorkout}
                onCloseWorkout={vi.fn()}
                expandActivity={vi.fn()}
              />
            </Router>
          </AppToastProvider>
        </CoachingRegistryProvider>
      </GarminBridgeProvider>
    </PersistenceProvider>
  );
}

describe("CalendarDialogs", () => {
  it("should open RawWorkoutDialog for a raw workout, not the executed preview", () => {
    // Arrange

    // Act
    renderDialogs(rawWorkout);

    // Assert
    expect(screen.getByTestId("raw-workout-dialog")).toBeInTheDocument();
    expect(
      screen.queryByTestId("executed-activity-dialog")
    ).not.toBeInTheDocument();
  });

  it("should open the executed preview for a projected activity, not RawWorkoutDialog", () => {
    // Arrange
    const activity = projectedWorkout();

    // Act
    renderDialogs(activity);

    // Assert
    expect(screen.getByTestId("executed-activity-dialog")).toBeInTheDocument();
    expect(screen.queryByTestId("raw-workout-dialog")).not.toBeInTheDocument();
  });

  it("should keep both dialogs closed when nothing is selected", () => {
    // Arrange

    // Act
    renderDialogs(null);

    // Assert
    expect(screen.queryByTestId("raw-workout-dialog")).not.toBeInTheDocument();
    expect(
      screen.queryByTestId("executed-activity-dialog")
    ).not.toBeInTheDocument();
  });
});
