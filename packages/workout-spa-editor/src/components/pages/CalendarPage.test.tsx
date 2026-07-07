import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";
import { Route, Router } from "wouter";
import { memoryLocation } from "wouter/memory-location";

import { db } from "../../adapters/dexie/dexie-database";
import { CoachingRegistryProvider } from "../../contexts/coaching-registry-context";
import { GarminBridgeProvider } from "../../contexts/garmin-bridge-context";
import { PersistenceProvider } from "../../contexts/persistence-context";
import type { PersistencePort } from "../../ports/persistence-port";
import { createInMemoryPersistence } from "../../test-utils/in-memory-persistence";
import { buildSourceActivityRecord } from "../../types/activity-record";
import type { WorkoutRecord } from "../../types/calendar-record";
import { AppToastProvider } from "../providers/AppToastProvider";
import CalendarPage from "./CalendarPage";

const PROFILE_ID = "00000000-0000-4000-8000-0000000000c1";

function makeWorkout(overrides: Partial<WorkoutRecord> = {}): WorkoutRecord {
  return {
    id: crypto.randomUUID(),
    profileId: PROFILE_ID,
    date: "2026-04-06",
    sport: "running",
    source: "kaiord",
    sourceId: null,
    planId: null,
    state: "raw",
    raw: {
      title: "Easy run",
      description: "30 min easy",
      comments: [],
      distance: null,
      duration: { value: 1800, unit: "s" },
      prescribedRpe: null,
      rawHash: "abc123",
    },
    krd: null,
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

function renderCalendar(
  path = "/calendar/2026-W15",
  persistence: PersistencePort = createInMemoryPersistence()
) {
  const { hook, history } = memoryLocation({ path, record: true });
  const rendered = render(
    <PersistenceProvider persistence={persistence}>
      <GarminBridgeProvider>
        <CoachingRegistryProvider factories={[]}>
          <AppToastProvider>
            <Router hook={hook}>
              <Route path="/calendar/:weekId?">
                <CalendarPage />
              </Route>
            </Router>
          </AppToastProvider>
        </CoachingRegistryProvider>
      </GarminBridgeProvider>
    </PersistenceProvider>
  );
  return { ...rendered, history };
}

describe("CalendarPage", () => {
  beforeEach(async () => {
    await db.table("workouts").clear();
    await db.table("profiles").clear();
    await db.table("meta").clear();
    await db.table("profiles").put({
      id: PROFILE_ID,
      name: "Tester",
      sportZones: {},
      linkedAccounts: [],
      createdAt: "2026-04-01T00:00:00.000Z",
      updatedAt: "2026-04-01T00:00:00.000Z",
    });
    await db.table("meta").put({ key: "activeProfileId", value: PROFILE_ID });
  });

  it("should not render the first-visit welcome card when no workouts exist", async () => {
    // Arrange

    // Act

    renderCalendar();

    // Assert
    await waitFor(() => {
      expect(screen.getByTestId("calendar-page")).toBeInTheDocument();
    });
    expect(screen.queryByTestId("first-visit-state")).not.toBeInTheDocument();
  });

  it("should show empty-week state when workouts exist in other weeks", async () => {
    // Arrange

    await db.table("workouts").add(makeWorkout({ date: "2026-03-30" }));

    // Act

    renderCalendar();

    // Assert

    await waitFor(() => {
      expect(screen.getByTestId("empty-week-state")).toBeInTheDocument();
    });
  });

  it("should render workout cards in the correct day column", async () => {
    // Arrange

    const workout = makeWorkout({ id: "w-mon", date: "2026-04-06" });
    await db.table("workouts").add(workout);

    // Act

    renderCalendar();

    // Assert

    expect(await screen.findByTestId("workout-card-w-mon")).toBeInTheDocument();
  });

  it("should show batch processing banner when raw workouts exist", async () => {
    // Arrange

    await db.table("workouts").add(makeWorkout({ date: "2026-04-07" }));
    await db
      .table("workouts")
      .add(makeWorkout({ date: "2026-04-08", id: "w2" }));

    // Act

    renderCalendar();

    // Assert

    await waitFor(() => {
      expect(screen.getByText(/2 raw workouts/)).toBeInTheDocument();
    });
  });

  it("should stack multiple workouts per day by createdAt", async () => {
    // Arrange

    const w1 = makeWorkout({
      id: "w-early",
      date: "2026-04-06",
      createdAt: "2026-04-06T06:00:00.000Z",
      raw: {
        title: "Morning swim",
        description: "",
        comments: [],
        distance: null,
        duration: null,
        prescribedRpe: null,
        rawHash: "h1",
      },
    });
    const w2 = makeWorkout({
      id: "w-late",
      date: "2026-04-06",
      createdAt: "2026-04-06T18:00:00.000Z",
      raw: {
        title: "Evening run",
        description: "",
        comments: [],
        distance: null,
        duration: null,
        prescribedRpe: null,
        rawHash: "h2",
      },
    });
    await db.table("workouts").bulkAdd([w2, w1]);

    // Act

    renderCalendar();

    // Assert

    await waitFor(() => {
      const cards = screen.getAllByTestId(/^workout-card-/);
      expect(cards).toHaveLength(2);
      expect(cards[0]).toHaveTextContent("Morning swim");
      expect(cards[1]).toHaveTextContent("Evening run");
    });
  });

  it("should show week navigation controls", async () => {
    // Arrange

    await db.table("workouts").add(makeWorkout({ date: "2026-04-06" }));

    // Act

    renderCalendar();

    // Assert

    await waitFor(() => {
      expect(screen.getByTestId("week-navigation")).toBeInTheDocument();
    });
    expect(screen.getByLabelText("Previous week")).toBeInTheDocument();
    expect(screen.getByLabelText("Next week")).toBeInTheDocument();
    expect(screen.getByText("Today")).toBeInTheDocument();
  });

  it("should preview a projected activity card instead of opening the editor", async () => {
    // Arrange

    const persistence = createInMemoryPersistence();
    const activity = buildSourceActivityRecord({
      profileId: PROFILE_ID,
      date: "2026-04-06",
      sport: "running",
      sourceBridgeId: "garmin-bridge",
      externalId: "ext-1",
      durationSeconds: 1800,
    });
    await persistence.activities.upsertByExternalId(activity);
    const user = userEvent.setup();

    // Act

    const { history } = renderCalendar("/calendar/2026-W15", persistence);
    const card = await screen.findByTestId(`workout-card-${activity.id}`);
    await user.click(card);

    // Assert

    expect(
      await screen.findByTestId("executed-activity-dialog")
    ).toBeInTheDocument();
    expect(history.at(-1)).toBe("/calendar/2026-W15");
  });
});
