import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import type { WorkoutRecord } from "../../types/calendar-record";
import type { CoachingActivity } from "../../types/coaching-activity";
import { CalendarWeekGrid } from "./CalendarWeekGrid";
import { DAYS_IN_WEEK } from "./CalendarWeekGrid.test-fixtures";

const DAYS = [
  "2026-04-06",
  "2026-04-07",
  "2026-04-08",
  "2026-04-09",
  "2026-04-10",
  "2026-04-11",
  "2026-04-12",
];

const makeWorkout = (id: string, date: string): WorkoutRecord =>
  ({
    id,
    date,
    sport: "running",
    source: "kaiord",
    state: "raw",
    raw: { title: "Easy run", duration: { value: 1800, unit: "s" } },
  }) as unknown as WorkoutRecord;

const makeCoaching = (id: string, date: string): CoachingActivity => ({
  id,
  source: "test-platform",
  sourceBadge: "TST",
  date,
  sport: { label: "Cycling", icon: "\u{1F6B4}" },
  title: "Coach intervals",
  duration: "1:30 h",
  effort: 3,
  status: "pending",
});

describe("CalendarWeekGrid", () => {
  it("should render 7 day columns", () => {
    // Arrange

    // Act

    render(
      <CalendarWeekGrid
        days={DAYS}
        workoutsByDay={{}}
        todayDate="2026-04-06"
        onWorkoutClick={vi.fn()}
        onEmptyDayClick={vi.fn()}
      />
    );

    // Assert

    expect(screen.getByTestId("calendar-week-grid")).toBeInTheDocument();
    expect(screen.getAllByTestId(/^day-column-/)).toHaveLength(DAYS_IN_WEEK);
  });

  it("should render workout cards in correct day", () => {
    // Arrange

    // Act

    render(
      <CalendarWeekGrid
        days={DAYS}
        workoutsByDay={{ "2026-04-07": [makeWorkout("w1", "2026-04-07")] }}
        todayDate="2026-04-06"
        onWorkoutClick={vi.fn()}
        onEmptyDayClick={vi.fn()}
      />
    );

    // Assert

    expect(screen.getByTestId("workout-card-w1")).toBeInTheDocument();
  });

  it("should render coaching cards alongside workouts", () => {
    // Arrange

    // Act

    render(
      <CalendarWeekGrid
        days={DAYS}
        workoutsByDay={{ "2026-04-07": [makeWorkout("w1", "2026-04-07")] }}
        coachingByDay={{
          "2026-04-07": [makeCoaching("c1", "2026-04-07")],
        }}
        todayDate="2026-04-06"
        onWorkoutClick={vi.fn()}
        onEmptyDayClick={vi.fn()}
      />
    );

    // Assert

    expect(screen.getByTestId("workout-card-w1")).toBeInTheDocument();
    expect(screen.getByTestId("coaching-card-c1")).toBeInTheDocument();
    expect(screen.getByText("Coach intervals")).toBeInTheDocument();
    expect(screen.getByText("· TST")).toBeInTheDocument();
  });

  it("should render coaching cards without workouts", () => {
    // Arrange

    // Act

    render(
      <CalendarWeekGrid
        days={DAYS}
        workoutsByDay={{}}
        coachingByDay={{
          "2026-04-08": [makeCoaching("c2", "2026-04-08")],
        }}
        todayDate="2026-04-06"
        onWorkoutClick={vi.fn()}
        onEmptyDayClick={vi.fn()}
      />
    );

    // Assert

    expect(screen.getByTestId("coaching-card-c2")).toBeInTheDocument();
  });

  it("should show empty-day button only when no workouts AND no coaching", () => {
    // Arrange

    // Act

    render(
      <CalendarWeekGrid
        days={DAYS}
        workoutsByDay={{}}
        coachingByDay={{
          "2026-04-06": [makeCoaching("c3", "2026-04-06")],
        }}
        todayDate="2026-04-06"
        onWorkoutClick={vi.fn()}
        onEmptyDayClick={vi.fn()}
      />
    );

    // Assert

    expect(
      screen.queryByTestId("empty-day-2026-04-06")
    ).not.toBeInTheDocument();
    expect(screen.getByTestId("empty-day-2026-04-07")).toBeInTheDocument();
  });

  it("should render with empty coaching data (no registry)", () => {
    // Arrange

    // Act

    render(
      <CalendarWeekGrid
        days={DAYS}
        workoutsByDay={{}}
        todayDate="2026-04-06"
        onWorkoutClick={vi.fn()}
        onEmptyDayClick={vi.fn()}
      />
    );

    // Assert

    expect(screen.getAllByTestId(/^empty-day-/)).toHaveLength(DAYS_IN_WEEK);
  });
});
