/**
 * LibraryPage `?date=` short-circuit tests.
 *
 * Covers the four URL-derived paths for the schedule action:
 * 1. `?source=template-picker&date=YYYY-MM-DD` → schedule directly,
 *    navigate to `/calendar`, no `ScheduleDateDialog`.
 * 2. No query params → explicit `ScheduleDateDialog` flow.
 * 3. Malformed `?date=` → explicit dialog flow.
 * 4. `?date=` present but `?source=` is not `template-picker` →
 *    explicit dialog flow.
 *
 * Co-located with the existing `LibraryPage.test.tsx`; lives in its own
 * file because these tests require a wouter `Router` wrapper for
 * `useSearch()` reads, whereas the existing tests do not.
 */

import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";
import { Router } from "wouter";
import { memoryLocation } from "wouter/memory-location";

import { db } from "../../adapters/dexie/dexie-database";
import { createDexiePersistence } from "../../adapters/dexie/dexie-persistence-adapter";
import { CoachingRegistryProvider } from "../../contexts/coaching-registry-context";
import { GarminBridgeProvider } from "../../contexts/garmin-bridge-context";
import { PersistenceProvider } from "../../contexts/persistence-context";
import { ThemeProvider } from "../../contexts/ThemeContext";
import { useWorkoutStore } from "../../store/workout-store";
import type { WorkoutTemplate } from "../../types/workout-library";
import { AppToastProvider } from "../providers/AppToastProvider";
import LibraryPage from "./LibraryPage";

const PROFILE_ID = "00000000-0000-4000-8000-0000000000e1";
const TARGET_DATE = "2026-06-01";

function makeTemplate(
  overrides: Partial<WorkoutTemplate> = {}
): WorkoutTemplate {
  const id = overrides.id ?? crypto.randomUUID();
  return {
    id,
    name: "Easy Ride",
    sport: "cycling",
    krd: {
      version: "1.0",
      type: "structured_workout",
      metadata: { created: "2026-01-01T00:00:00Z", sport: "cycling" },
      extensions: {
        structured_workout: { name: "Easy Ride", sport: "cycling", steps: [] },
      },
    },
    tags: [],
    createdAt: "2026-01-01T00:00:00Z",
    updatedAt: "2026-01-01T00:00:00Z",
    ...overrides,
  };
}

function renderLibrary(path = "/library") {
  const loc = memoryLocation({ path, record: true });
  const ui = (
    <ThemeProvider>
      <PersistenceProvider persistence={createDexiePersistence(db)}>
        <GarminBridgeProvider>
          <CoachingRegistryProvider factories={[]}>
            <AppToastProvider>
              <Router hook={loc.hook}>
                <LibraryPage />
              </Router>
            </AppToastProvider>
          </CoachingRegistryProvider>
        </GarminBridgeProvider>
      </PersistenceProvider>
    </ThemeProvider>
  );
  return { ...render(ui), location: loc };
}

describe("LibraryPage short-circuit scheduling", () => {
  beforeEach(async () => {
    useWorkoutStore.setState({ currentWorkout: null });
    await db.table("templates").clear();
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
    await db
      .table("templates")
      .add(makeTemplate({ id: "t1", name: "Easy Ride", sport: "cycling" }));
  });

  it("should short-circuit scheduling when ?source=template-picker and ?date= is valid", async () => {
    // Arrange
    const user = userEvent.setup();
    const { location } = renderLibrary(
      `/library?source=template-picker&date=${TARGET_DATE}`
    );

    await waitFor(() => {
      expect(screen.getByText("Easy Ride")).toBeInTheDocument();
    });

    // Act
    await user.click(screen.getByRole("button", { name: /schedule/i }));

    // Assert
    await waitFor(async () => {
      const workouts = await db.table("workouts").toArray();
      expect(workouts).toHaveLength(1);
      expect(workouts[0].date).toBe(TARGET_DATE);
      expect(workouts[0].profileId).toBe(PROFILE_ID);
    });
    expect(screen.queryByText("Schedule Workout")).not.toBeInTheDocument();
    expect(location.history.at(-1)).toBe("/calendar");
  });

  it("should fall through to ScheduleDateDialog when ?date= is absent", async () => {
    // Arrange
    const user = userEvent.setup();
    const { location } = renderLibrary("/library?source=template-picker");
    const initialPath = location.history.at(-1);

    await waitFor(() => {
      expect(screen.getByText("Easy Ride")).toBeInTheDocument();
    });

    // Act
    await user.click(screen.getByRole("button", { name: /schedule/i }));

    // Assert
    await waitFor(() => {
      expect(screen.getByText("Schedule Workout")).toBeInTheDocument();
    });
    const workouts = await db.table("workouts").toArray();
    expect(workouts).toHaveLength(0);
    expect(location.history.at(-1)).toBe(initialPath);
  });

  it("should fall through to ScheduleDateDialog when ?date= is malformed", async () => {
    // Arrange
    const user = userEvent.setup();
    renderLibrary("/library?source=template-picker&date=not-a-date");

    await waitFor(() => {
      expect(screen.getByText("Easy Ride")).toBeInTheDocument();
    });

    // Act
    await user.click(screen.getByRole("button", { name: /schedule/i }));

    // Assert
    await waitFor(() => {
      expect(screen.getByText("Schedule Workout")).toBeInTheDocument();
    });
    const workouts = await db.table("workouts").toArray();
    expect(workouts).toHaveLength(0);
  });

  it("should fall through to ScheduleDateDialog when ?source is not template-picker", async () => {
    // Arrange
    const user = userEvent.setup();
    renderLibrary(`/library?date=${TARGET_DATE}`);

    await waitFor(() => {
      expect(screen.getByText("Easy Ride")).toBeInTheDocument();
    });

    // Act
    await user.click(screen.getByRole("button", { name: /schedule/i }));

    // Assert
    await waitFor(() => {
      expect(screen.getByText("Schedule Workout")).toBeInTheDocument();
    });
    const workouts = await db.table("workouts").toArray();
    expect(workouts).toHaveLength(0);
  });
});
