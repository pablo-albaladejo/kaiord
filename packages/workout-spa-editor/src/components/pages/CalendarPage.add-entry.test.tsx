/**
 * CalendarPage add-entry flow: the `+` opens the Workout|Wellness chooser
 * (it no longer navigates directly), choosing Workout navigates to
 * `/workout/new?date=<day>`, choosing Wellness opens the wellness entry
 * surface, and the always-visible `+` neither starts a drag nor breaks
 * drop-to-reschedule onto a cell that shows it.
 */

import { act, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { Route, Router } from "wouter";
import { memoryLocation } from "wouter/memory-location";

import { db } from "../../adapters/dexie/dexie-database";
import { CoachingRegistryProvider } from "../../contexts/coaching-registry-context";
import { GarminBridgeProvider } from "../../contexts/garmin-bridge-context";
import { PersistenceProvider } from "../../contexts/persistence-context";
import { createInMemoryPersistence } from "../../test-utils/in-memory-persistence";
import type { WorkoutRecord } from "../../types/calendar-record";
import { AppToastProvider } from "../providers/AppToastProvider";
import CalendarPage from "./CalendarPage";

const PROFILE_ID = "00000000-0000-4000-8000-0000000000c2";

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
  } as WorkoutRecord;
}

function renderCalendar(path = "/calendar/2026-W15") {
  const loc = memoryLocation({ path, record: true });
  const view = render(
    <PersistenceProvider persistence={createInMemoryPersistence()}>
      <GarminBridgeProvider>
        <CoachingRegistryProvider factories={[]}>
          <AppToastProvider>
            <Router hook={loc.hook}>
              <Route path="/calendar/:weekId?">
                <CalendarPage />
              </Route>
            </Router>
          </AppToastProvider>
        </CoachingRegistryProvider>
      </GarminBridgeProvider>
    </PersistenceProvider>
  );
  return { ...view, history: loc.history };
}

const setMatchMedia = (matches: boolean): void => {
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    configurable: true,
    value: () => ({
      matches,
      media: "(min-width: 768px)",
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }),
  });
};

const stubElementFromPoint = (day: string | null): void => {
  Object.defineProperty(document, "elementFromPoint", {
    configurable: true,
    value: () => {
      if (!day) return null;
      const node = document.createElement("div");
      node.setAttribute("data-day", day);
      return node;
    },
  });
};

describe("CalendarPage add-entry flow", () => {
  beforeEach(async () => {
    setMatchMedia(false);
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

  it("should open the chooser instead of navigating when + is clicked", async () => {
    // Arrange
    const user = userEvent.setup();
    const { history } = renderCalendar();
    const addButton = await screen.findByTestId("empty-day-2026-04-06");

    // Act
    await user.click(addButton);

    // Assert
    expect(await screen.findByTestId("add-entry-chooser")).toBeInTheDocument();
    expect(history.at(-1)).not.toContain("/workout/new");
  });

  it("should navigate to /workout/new with the day when Workout is chosen", async () => {
    // Arrange
    const user = userEvent.setup();
    const { history } = renderCalendar();
    await user.click(await screen.findByTestId("empty-day-2026-04-06"));

    // Act
    await user.click(await screen.findByTestId("add-entry-choose-workout"));

    // Assert
    expect(history.at(-1)).toBe("/workout/new?date=2026-04-06");
  });

  it("should open the wellness entry surface when Wellness is chosen", async () => {
    // Arrange
    const user = userEvent.setup();
    renderCalendar();
    await user.click(await screen.findByTestId("empty-day-2026-04-06"));

    // Act
    await user.click(await screen.findByTestId("add-entry-choose-wellness"));

    // Assert
    expect(
      await screen.findByTestId("wellness-entry-dialog")
    ).toBeInTheDocument();
  });

  it("should render the + on a day that already has a workout", async () => {
    // Arrange
    await db.table("workouts").add(makeWorkout({ id: "w-mon" }));

    // Act
    renderCalendar();

    // Assert
    await screen.findByTestId("workout-card-w-mon");
    const dayColumn = screen.getByTestId("day-column-2026-04-06");
    expect(
      within(dayColumn).getByTestId("empty-day-2026-04-06")
    ).toBeInTheDocument();
  });

  it("should still reschedule a workout dropped onto a cell that shows the +", async () => {
    // Arrange
    setMatchMedia(true);
    stubElementFromPoint("2026-04-09");
    await db.table("workouts").add(makeWorkout({ id: "w-mon" }));
    renderCalendar();
    const card = await screen.findByTestId("workout-card-w-mon");

    // Act
    act(() => {
      card.dispatchEvent(
        new PointerEvent("pointerdown", { bubbles: true, pointerType: "mouse" })
      );
    });
    act(() => {
      const ev = new Event("pointerup") as Event & {
        clientX: number;
        clientY: number;
      };
      Object.defineProperty(ev, "clientX", { value: 10 });
      Object.defineProperty(ev, "clientY", { value: 10 });
      window.dispatchEvent(ev);
    });

    // Assert
    await waitFor(async () => {
      const moved = await db.table("workouts").get("w-mon");
      expect(moved?.date).toBe("2026-04-09");
    });
  });
});
