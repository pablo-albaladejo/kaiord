/**
 * ExecutedWorkoutsSection — matched-state dialog body for the executed
 * (e.g., Garmin/FIT) recordings auto-linked to a coaching activity.
 * Asserts: rows render per executed workout, click fires
 * `onOpenExecuted` with the matching record, empty list renders nothing.
 */

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import type { WorkoutRecord } from "../../../types/calendar-record";
import { ExecutedWorkoutsSection } from "./ExecutedWorkoutsSection";

const ONE_HOUR_SECONDS = 3600;

const makeWorkout = (overrides: Partial<WorkoutRecord> = {}): WorkoutRecord =>
  ({
    id: "w-1",
    date: "2026-04-13",
    sport: "cycling",
    state: "raw",
    raw: {
      title: "Recorded cycling ride",
      description: "From Garmin",
      duration: { value: ONE_HOUR_SECONDS, unit: "s" },
    },
    ...overrides,
  }) as unknown as WorkoutRecord;

describe("ExecutedWorkoutsSection", () => {
  it("should render one row per executed workout", () => {
    // Arrange
    const executed = [
      makeWorkout({ id: "exec-1" }),
      makeWorkout({
        id: "exec-2",
        raw: {
          title: "Second activity",
          duration: { value: 1800, unit: "s" },
        } as WorkoutRecord["raw"],
      }),
    ];

    // Act
    render(
      <ExecutedWorkoutsSection executed={executed} onOpenExecuted={vi.fn()} />
    );

    // Assert
    expect(screen.getByTestId("executed-workouts-section")).toBeInTheDocument();
    expect(screen.getByTestId("executed-workout-exec-1")).toBeInTheDocument();
    expect(screen.getByTestId("executed-workout-exec-2")).toBeInTheDocument();
    expect(screen.getByText("Recorded cycling ride")).toBeInTheDocument();
    expect(screen.getByText("Second activity")).toBeInTheDocument();
  });

  it("should fire onOpenExecuted with the clicked workout", async () => {
    // Arrange
    const onOpenExecuted = vi.fn();
    const clicked = makeWorkout({ id: "exec-1" });

    // Act
    render(
      <ExecutedWorkoutsSection
        executed={[clicked]}
        onOpenExecuted={onOpenExecuted}
      />
    );
    await userEvent.click(screen.getByTestId("executed-workout-exec-1"));

    // Assert
    expect(onOpenExecuted).toHaveBeenCalledTimes(1);
    expect(onOpenExecuted).toHaveBeenCalledWith(clicked);
  });

  it("should render nothing when executed is empty", () => {
    // Arrange

    // Act
    const { container } = render(
      <ExecutedWorkoutsSection executed={[]} onOpenExecuted={vi.fn()} />
    );

    // Assert
    expect(container.firstChild).toBeNull();
    expect(
      screen.queryByTestId("executed-workouts-section")
    ).not.toBeInTheDocument();
  });
});
