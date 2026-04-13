import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";
import { Router } from "wouter";
import { memoryLocation } from "wouter/memory-location";

import { db } from "../../adapters/dexie/dexie-database";
import { GarminBridgeProvider, SettingsDialogProvider } from "../../contexts";
import { CoachingRegistryProvider } from "../../contexts/coaching-registry-context";
import type { WorkoutRecord } from "../../types/calendar-record";
import CalendarPage from "./CalendarPage";

function makeWorkout(overrides: Partial<WorkoutRecord> = {}): WorkoutRecord {
  return {
    id: crypto.randomUUID(),
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

function renderCalendar(path = "/calendar/2026-W15") {
  const { hook } = memoryLocation({ path, record: true });
  return render(
    <SettingsDialogProvider>
      <GarminBridgeProvider>
        <CoachingRegistryProvider sources={[]}>
          <Router hook={hook}>
            <CalendarPage />
          </Router>
        </CoachingRegistryProvider>
      </GarminBridgeProvider>
    </SettingsDialogProvider>
  );
}

describe("CalendarPage", () => {
  beforeEach(async () => {
    await db.table("workouts").clear();
  });

  it("shows first-visit state when no workouts exist", async () => {
    renderCalendar();

    await waitFor(() => {
      expect(screen.getByTestId("first-visit-state")).toBeInTheDocument();
    });
  });

  it("shows empty-week state when workouts exist in other weeks", async () => {
    await db.table("workouts").add(makeWorkout({ date: "2026-03-30" }));

    renderCalendar();

    await waitFor(() => {
      expect(screen.getByTestId("empty-week-state")).toBeInTheDocument();
    });
  });

  // Covered by e2e: calendar-workouts.spec.ts "Week with workouts shows cards"
  // useLiveQuery doesn't react to fake-indexeddb in jsdom
  it.skip("renders workout cards in the correct day column", async () => {
    const workout = makeWorkout({ id: "w-mon", date: "2026-04-06" });
    await db.table("workouts").add(workout);

    renderCalendar();

    await waitFor(
      () => {
        expect(screen.getByTestId("workout-card-w-mon")).toBeInTheDocument();
      },
      { timeout: 5000 }
    );
  });

  // Covered by e2e: calendar-batch.spec.ts "banner shows count"
  it.skip("shows batch processing banner when raw workouts exist", async () => {
    await db.table("workouts").add(makeWorkout({ date: "2026-04-07" }));
    await db
      .table("workouts")
      .add(makeWorkout({ date: "2026-04-08", id: "w2" }));

    renderCalendar();

    await waitFor(
      () => {
        expect(screen.getByText(/2 raw workouts/)).toBeInTheDocument();
      },
      { timeout: 5000 }
    );
  });

  // Covered by e2e: calendar-workouts.spec.ts "Multiple workouts per day"
  it.skip("stacks multiple workouts per day by createdAt", async () => {
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

    renderCalendar();

    await waitFor(
      () => {
        const cards = screen.getAllByTestId(/^workout-card-/);
        expect(cards).toHaveLength(2);
        expect(cards[0]).toHaveTextContent("Morning swim");
        expect(cards[1]).toHaveTextContent("Evening run");
      },
      { timeout: 5000 }
    );
  });

  it("shows week navigation controls", async () => {
    await db.table("workouts").add(makeWorkout({ date: "2026-04-06" }));

    renderCalendar();

    await waitFor(() => {
      expect(screen.getByTestId("week-navigation")).toBeInTheDocument();
    });
    expect(screen.getByLabelText("Previous week")).toBeInTheDocument();
    expect(screen.getByLabelText("Next week")).toBeInTheDocument();
    expect(screen.getByText("Today")).toBeInTheDocument();
  });
});
