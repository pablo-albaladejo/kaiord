import { render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import type { WorkoutRecord } from "../../types/calendar-record";
import type { CoachingActivity } from "../../types/coaching-activity";
import { CalendarWeekList } from "./CalendarWeekList";

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
  source: "train2go",
  sourceBadge: "T2G",
  date,
  sport: { label: "Cycling", icon: "\u{1F6B4}" },
  title: "Coach intervals",
  duration: "1:30 h",
  effort: 3,
  status: "pending",
});

describe("CalendarWeekList", () => {
  it("should render 7 day sections in calendar order", () => {
    // Arrange

    // Act
    render(
      <CalendarWeekList
        days={DAYS}
        todayDate="2026-04-06"
        onWorkoutClick={vi.fn()}
        onEmptyDayClick={vi.fn()}
      />
    );

    // Assert
    expect(screen.getByTestId("calendar-week-list")).toBeInTheDocument();
    const sections = screen.getAllByTestId(/^calendar-list-day-/);
    expect(sections).toHaveLength(DAYS_IN_WEEK);
    const orderedTestIds = sections.map((s) => s.getAttribute("data-testid"));
    expect(orderedTestIds).toEqual(DAYS.map((d) => `calendar-list-day-${d}`));
  });

  it("should render workouts in their matching day section", () => {
    // Arrange

    // Act
    render(
      <CalendarWeekList
        days={DAYS}
        soloActualsByDay={{
          "2026-04-07": [makeWorkout("w1", "2026-04-07")],
        }}
        todayDate="2026-04-06"
        onWorkoutClick={vi.fn()}
        onEmptyDayClick={vi.fn()}
      />
    );

    // Assert
    const section = screen.getByTestId("calendar-list-day-2026-04-07");
    expect(within(section).getByTestId("workout-card-w1")).toBeInTheDocument();
  });

  it("should render coaching plans in their day section", () => {
    // Arrange

    // Act
    render(
      <CalendarWeekList
        days={DAYS}
        soloPlansByDay={{
          "2026-04-08": [makeCoaching("c1", "2026-04-08")],
        }}
        todayDate="2026-04-06"
        onWorkoutClick={vi.fn()}
        onEmptyDayClick={vi.fn()}
      />
    );

    // Assert
    const section = screen.getByTestId("calendar-list-day-2026-04-08");
    expect(within(section).getByTestId("coaching-card-c1")).toBeInTheDocument();
  });

  it("should render an Add button per section even when workouts exist", () => {
    // Arrange

    // Act
    render(
      <CalendarWeekList
        days={DAYS}
        soloActualsByDay={{
          "2026-04-07": [makeWorkout("w1", "2026-04-07")],
        }}
        todayDate="2026-04-06"
        onWorkoutClick={vi.fn()}
        onEmptyDayClick={vi.fn()}
      />
    );

    // Assert
    expect(
      screen.getByTestId("calendar-list-add-2026-04-07")
    ).toBeInTheDocument();
    expect(
      screen.getByTestId("calendar-list-add-2026-04-08")
    ).toBeInTheDocument();
  });

  it("should mark today's section with data-today and aria-current", () => {
    // Arrange

    // Act
    render(
      <CalendarWeekList
        days={DAYS}
        todayDate="2026-04-09"
        onWorkoutClick={vi.fn()}
        onEmptyDayClick={vi.fn()}
      />
    );

    // Assert
    const today = screen.getByTestId("calendar-list-day-2026-04-09");
    expect(today.getAttribute("data-today")).toBe("true");
    expect(today.getAttribute("aria-current")).toBe("date");
  });
});
