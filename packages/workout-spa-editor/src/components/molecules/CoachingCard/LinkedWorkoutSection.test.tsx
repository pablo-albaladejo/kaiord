/**
 * LinkedWorkoutSection — matched-state body for CoachingActivityDialog.
 * Asserts the spec contract: title + sport + duration are visible, and
 * the Split button disables itself while `splitting` is true.
 */

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import type { WorkoutRecord } from "../../../types/calendar-record";
import { LinkedWorkoutSection } from "./LinkedWorkoutSection";

const makeWorkout = (overrides: Partial<WorkoutRecord> = {}): WorkoutRecord =>
  ({
    id: "w-1",
    date: "2026-04-13",
    sport: "cycling",
    state: "raw",
    raw: {
      title: "Sweet spot intervals",
      description: "3x10 at 90% FTP",
      duration: { value: 60 * 60, unit: "s" },
    },
    ...overrides,
  }) as unknown as WorkoutRecord;

describe("LinkedWorkoutSection", () => {
  it("should render the matched workout's title, sport, and duration", () => {
    // Arrange

    // Act

    render(
      <LinkedWorkoutSection
        workout={makeWorkout()}
        splitting={false}
        onSplit={vi.fn()}
      />
    );

    // Assert

    expect(screen.getByText("Sweet spot intervals")).toBeInTheDocument();
    expect(screen.getByText(/Cycling.*60min/)).toBeInTheDocument();
    expect(screen.getByTestId("linked-workout-section")).toBeInTheDocument();
  });

  it("should invoke onSplit when the Split button is clicked", async () => {
    // Arrange

    const onSplit = vi.fn();
    render(
      <LinkedWorkoutSection
        workout={makeWorkout()}
        splitting={false}
        onSplit={onSplit}
      />
    );

    // Act

    await userEvent.click(screen.getByRole("button", { name: "Split" }));

    // Assert

    expect(onSplit).toHaveBeenCalledTimes(1);
  });

  it("should disable the Split button while a split is in flight", () => {
    // Arrange

    // Act

    render(
      <LinkedWorkoutSection
        workout={makeWorkout()}
        splitting={true}
        onSplit={vi.fn()}
      />
    );

    // Assert

    expect(screen.getByRole("button", { name: "Splitting…" })).toBeDisabled();
  });

  it("should fall back to a description-truncated title when no `raw.title` is set", () => {
    // Arrange

    // Act

    render(
      <LinkedWorkoutSection
        workout={makeWorkout({
          raw: {
            description: "30 minute endurance ride at zone 2",
          } as WorkoutRecord["raw"],
        })}
        splitting={false}
        onSplit={vi.fn()}
      />
    );

    // Assert

    expect(
      screen.getByText("30 minute endurance ride at zone 2")
    ).toBeInTheDocument();
  });
});
