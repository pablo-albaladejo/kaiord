import { render, screen } from "@testing-library/react";
import type { ReactElement } from "react";
import { describe, expect, it, vi } from "vitest";

import { ToastContextProvider } from "../../contexts/ToastContext";
import type { WorkoutRecord } from "../../types/calendar-record";
import type { CoachingActivity } from "../../types/coaching-activity";
import { CalendarWeekGrid } from "./CalendarWeekGrid";

const renderWithToast = (ui: ReactElement) =>
  render(<ToastContextProvider>{ui}</ToastContextProvider>);

const DAYS_IN_WEEK = 7;

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
    renderWithToast(
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
    renderWithToast(
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
    renderWithToast(
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
    renderWithToast(
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
    renderWithToast(
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
    renderWithToast(
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

  it("should render a sticky day header row above the day columns", () => {
    // Arrange

    // Act
    renderWithToast(
      <CalendarWeekGrid
        days={DAYS}
        workoutsByDay={{}}
        todayDate="2026-04-06"
        onWorkoutClick={vi.fn()}
        onEmptyDayClick={vi.fn()}
      />
    );

    // Assert
    const header = screen.getByTestId("calendar-week-grid-header");
    expect(header).toBeInTheDocument();
    expect(header.className).toContain("sticky");
    for (const date of DAYS) {
      expect(
        screen.getByTestId(`calendar-week-grid-header-${date}`)
      ).toBeInTheDocument();
    }
  });

  it("should mark today's header cell with data-today and the today tint", () => {
    // Arrange

    // Act
    renderWithToast(
      <CalendarWeekGrid
        days={DAYS}
        workoutsByDay={{}}
        todayDate="2026-04-09"
        onWorkoutClick={vi.fn()}
        onEmptyDayClick={vi.fn()}
      />
    );

    // Assert
    const todayHeader = screen.getByTestId(
      "calendar-week-grid-header-2026-04-09"
    );
    expect(todayHeader.getAttribute("data-today")).toBe("true");
    expect(todayHeader.className).toContain("bg-primary-50/40");
    const todayBody = screen.getByTestId("day-column-2026-04-09");
    expect(todayBody.getAttribute("data-today")).toBe("true");
    expect(todayBody.className).toContain("bg-primary-50/40");
  });

  it("should render the multi-workout badge when a day has 3 or more activities", () => {
    // Arrange
    const w = (id: string): WorkoutRecord => makeWorkout(id, "2026-04-07");

    // Act
    renderWithToast(
      <CalendarWeekGrid
        days={DAYS}
        workoutsByDay={{
          "2026-04-07": [w("w1"), w("w2"), w("w3")],
        }}
        todayDate="2026-04-06"
        onWorkoutClick={vi.fn()}
        onEmptyDayClick={vi.fn()}
      />
    );

    // Assert
    expect(
      screen.getByTestId("multi-workout-badge-2026-04-07")
    ).toHaveTextContent("3 activities");
    expect(
      screen.queryByTestId("multi-workout-badge-2026-04-08")
    ).not.toBeInTheDocument();
  });
});
