/**
 * Co-located tests for `useCalendarPage`.
 *
 * Exercises the three branches the page UI relies on:
 *  - positive flow → `state: "ready"` with hydrated buckets and density
 *  - auto-match suggestion → `suggestions[0]` surfaces the seeded pair
 *  - no active profile → `state: "ready"` with empty suggestions and
 *    no crash from the downstream live-query joins
 *
 * The week id is fixed (`2026-W15`, Mon 2026-04-06 → Sun 2026-04-12)
 * so seeded rows always fall inside the visible week regardless of the
 * test machine's clock.
 */

import { renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { Route, Router } from "wouter";
import { memoryLocation } from "wouter/memory-location";

import { db } from "../../adapters/dexie/dexie-database";
import { AppToastProvider } from "../../components/providers/AppToastProvider";
import { GarminBridgeProvider } from "../../contexts";
import { CoachingRegistryProvider } from "../../contexts/coaching-registry-context";
import { PersistenceProvider } from "../../contexts/persistence-context";
import { createInMemoryPersistence } from "../../test-utils/in-memory-persistence";
import type { WorkoutRecord } from "../../types/calendar-record";
import type { CoachingActivityRecord } from "../../types/coaching-activity-record";
import type { Profile } from "../../types/profile";
import { useCalendarPage } from "./use-calendar-page";

const PROFILE_ID = "00000000-0000-4000-8000-0000000000a1";
const WEEK_ID = "2026-W15";
const MONDAY = "2026-04-06";
const ONE_HOUR_SECONDS = 3600;

const makeProfile = (id: string = PROFILE_ID): Profile => ({
  id,
  name: "Tester",
  sportZones: {},
  linkedAccounts: [],
  createdAt: "2026-04-01T00:00:00.000Z",
  updatedAt: "2026-04-01T00:00:00.000Z",
});

const seedActivity = (date: string): CoachingActivityRecord => ({
  id: `${PROFILE_ID}:train2go:1`,
  profileId: PROFILE_ID,
  source: "train2go",
  sourceId: "1",
  date,
  sport: "cycling",
  title: "FTP test",
  duration: "60 min",
  status: "pending",
  fetchedAt: "2026-04-05T10:00:00.000Z",
});

const seedWorkout = (
  date: string,
  durationSeconds: number = ONE_HOUR_SECONDS,
  id = "w-1",
  profileId: string = PROFILE_ID
): WorkoutRecord =>
  ({
    id,
    profileId,
    date,
    sport: "cycling",
    source: "manual",
    state: "ready",
    raw: {
      title: "FTP",
      description: "",
      comments: [],
      distance: null,
      duration: { value: durationSeconds, unit: "s" },
      prescribedRpe: null,
      rawHash: "h1",
    },
    createdAt: `${date}T08:00:00.000Z`,
    updatedAt: `${date}T08:00:00.000Z`,
  }) as unknown as WorkoutRecord;

const setActiveProfile = async (profile: Profile | null) => {
  if (profile) {
    await db.table("profiles").put(profile);
    await db.table("meta").put({ key: "activeProfileId", value: profile.id });
  } else {
    await db.table("meta").delete("activeProfileId");
  }
};

const clearAll = () =>
  Promise.all([
    db.table("workouts").clear(),
    db.table("coachingActivities").clear(),
    db.table("sessionMatches").clear(),
    db.table("autoMatchDismissals").clear(),
    db.table("profiles").clear(),
    db.table("meta").clear(),
    db.table("userPreferences").clear(),
  ]);

const wrap = (children: ReactNode) => {
  const { hook } = memoryLocation({ path: `/calendar/${WEEK_ID}` });
  return (
    <PersistenceProvider persistence={createInMemoryPersistence()}>
      <GarminBridgeProvider>
        <CoachingRegistryProvider factories={[]}>
          <AppToastProvider>
            <Router hook={hook}>
              <Route path="/calendar/:weekId?">{children}</Route>
            </Router>
          </AppToastProvider>
        </CoachingRegistryProvider>
      </GarminBridgeProvider>
    </PersistenceProvider>
  );
};

describe("useCalendarPage", () => {
  beforeEach(clearAll);
  afterEach(clearAll);

  it("should resolve to a ready state with hydrated buckets for the visible week", async () => {
    // Arrange
    await setActiveProfile(makeProfile());
    await db
      .table("workouts")
      .put(seedWorkout(MONDAY, ONE_HOUR_SECONDS, "w-mon"));

    // Act
    const { result } = renderHook(() => useCalendarPage(), {
      wrapper: ({ children }) => wrap(children),
    });

    // Assert
    await waitFor(() => {
      expect(result.current.state).toBe("ready");
    });
    if (result.current.state !== "ready") throw new Error("not ready");
    expect(result.current.s.data.days[0]).toBe(MONDAY);
    expect(result.current.buckets.soloActualsByDay[MONDAY]).toHaveLength(1);
    expect(result.current.suggestions).toEqual([]);
  });

  it("should surface an auto-match suggestion when an unmatched activity+workout pair exists", async () => {
    // Arrange
    await setActiveProfile(makeProfile());
    await db.table("coachingActivities").put(seedActivity(MONDAY));
    await db
      .table("workouts")
      .put(seedWorkout(MONDAY, ONE_HOUR_SECONDS, "w-1"));

    // Act
    const { result } = renderHook(() => useCalendarPage(), {
      wrapper: ({ children }) => wrap(children),
    });

    // Assert
    await waitFor(() => {
      if (result.current.state !== "ready") throw new Error("not ready yet");
      expect(result.current.suggestions).toHaveLength(1);
    });
    if (result.current.state !== "ready") throw new Error("not ready");
    expect(result.current.suggestions[0]!.activityId).toBe(
      `${PROFILE_ID}:train2go:1`
    );
    expect(result.current.suggestions[0]!.workoutId).toBe("w-1");
  });

  it("should fall back to a ready state with no suggestions and an empty calendar when no profile is active", async () => {
    // Arrange
    await setActiveProfile(null);
    await db
      .table("workouts")
      .put(seedWorkout(MONDAY, ONE_HOUR_SECONDS, "w-mon"));

    // Act
    const { result } = renderHook(() => useCalendarPage(), {
      wrapper: ({ children }) => wrap(children),
    });

    // Assert
    await waitFor(() => {
      expect(result.current.state).toBe("ready");
    });
    if (result.current.state !== "ready") throw new Error("not ready");
    expect(result.current.suggestions).toEqual([]);
    expect(result.current.view).toBeUndefined();
    // No active profile → calendar query is empty (profile-scoped read).
    expect(result.current.buckets.soloActualsByDay[MONDAY] ?? []).toHaveLength(
      0
    );
  });

  it("should isolate workouts to the active profile (cross-profile leak regression)", async () => {
    // Arrange
    const OTHER = "00000000-0000-4000-8000-0000000000b2";
    await setActiveProfile(makeProfile());
    await db
      .table("workouts")
      .put(seedWorkout(MONDAY, ONE_HOUR_SECONDS, "w-mine", PROFILE_ID));
    await db
      .table("workouts")
      .put(seedWorkout(MONDAY, ONE_HOUR_SECONDS, "w-other", OTHER));

    // Act
    const { result } = renderHook(() => useCalendarPage(), {
      wrapper: ({ children }) => wrap(children),
    });

    // Assert
    await waitFor(() => {
      expect(result.current.state).toBe("ready");
    });
    if (result.current.state !== "ready") throw new Error("not ready");
    const mondayCards = result.current.buckets.soloActualsByDay[MONDAY] ?? [];
    expect(mondayCards.map((w) => w.id)).toEqual(["w-mine"]);
  });
});
