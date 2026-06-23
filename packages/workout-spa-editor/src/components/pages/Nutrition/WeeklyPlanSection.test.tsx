import "fake-indexeddb/auto";

import { createWorkoutKRD, type Workout } from "@kaiord/core";
import { screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { db } from "../../../adapters/dexie/dexie-database";
import { createDexiePersistence } from "../../../adapters/dexie/dexie-persistence-adapter";
import { renderWithProviders } from "../../../test-utils";
import { WeeklyPlanSection } from "./WeeklyPlanSection";

const PROFILE_ID = "p1";
// Monday-to-Sunday week containing this Wednesday.
const MID_WEEK = "2026-06-17";
const WEDNESDAY = "2026-06-17";
const DAYS_IN_WEEK = 7;

const seedProfile = () =>
  db.table("profiles").put({
    id: PROFILE_ID,
    name: "Athlete",
    bodyWeight: 70,
    height: 178,
    birthDate: "1990-06-21",
    sex: "male",
    sportZones: {},
    linkedAccounts: [],
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  });

const workout: Workout = {
  sport: "training",
  steps: [
    {
      stepIndex: 0,
      durationType: "time",
      duration: { type: "time", seconds: 3600 },
      targetType: "open",
      target: { type: "open" },
      intensity: "active",
    },
  ],
};

const seedWorkout = () =>
  db.table("workouts").put({
    id: "11111111-1111-4111-8111-111111111112",
    profileId: PROFILE_ID,
    date: WEDNESDAY,
    sport: "training",
    source: "manual",
    sourceId: null,
    planId: null,
    state: "scheduled",
    raw: null,
    krd: createWorkoutKRD(workout),
    lastProcessingError: null,
    feedback: null,
    aiMeta: null,
    garminPushId: null,
    tags: [],
    previousState: null,
    createdAt: "2026-06-01T00:00:00.000Z",
    modifiedAt: null,
    updatedAt: "2026-06-01T00:00:00.000Z",
  });

const clearAll = () =>
  Promise.all([db.table("profiles").clear(), db.table("workouts").clear()]);

const renderSection = () =>
  renderWithProviders(
    <WeeklyPlanSection profileId={PROFILE_ID} date={MID_WEEK} />,
    { persistence: createDexiePersistence(db) }
  );

describe("WeeklyPlanSection", () => {
  beforeEach(clearAll);
  afterEach(clearAll);

  it("should render one row per day of the focused week", async () => {
    // Arrange
    await seedProfile();

    // Act
    renderSection();

    // Assert
    await waitFor(() =>
      expect(screen.getAllByTestId("weekly-plan-row")).toHaveLength(
        DAYS_IN_WEEK
      )
    );
  });

  it("should show a predicted expenditure for a BMR-resolvable day", async () => {
    // Arrange
    await seedProfile();

    // Act
    renderSection();

    // Assert
    await waitFor(() => {
      const cells = screen.getAllByTestId("weekly-plan-expenditure");
      expect(cells[0]).toHaveTextContent("kcal");
    });
  });

  it("should mark the day that has a scheduled workout", async () => {
    // Arrange
    await seedProfile();
    await seedWorkout();

    // Act
    renderSection();

    // Assert
    await waitFor(() =>
      expect(screen.getAllByTestId("weekly-plan-workout")).toHaveLength(1)
    );
  });
});
