/**
 * MatchToPicker — keyboard contract tests per `spa-coaching-integration`
 * "Match-to picker keyboard navigation" + "Picker Escape closes only
 * the picker".
 */

import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import type { WorkoutRecord } from "../../../types/calendar-record";
import { MatchToPicker } from "./MatchToPicker";

const makeWorkout = (
  id: string,
  sport: string,
  durationSeconds?: number
): WorkoutRecord =>
  ({
    id,
    date: "2026-04-13",
    sport,
    state: "raw",
    raw: durationSeconds
      ? { description: "x", duration: { value: durationSeconds, unit: "s" } }
      : { description: "x" },
  }) as unknown as WorkoutRecord;

describe("MatchToPicker — empty state", () => {
  it("should render the empty placeholder when no workouts are pickable", () => {
    render(
      <MatchToPicker
        workouts={[]}
        pending={false}
        onSelect={vi.fn()}
        onClose={vi.fn()}
      />
    );

    expect(
      screen.getByText(/no same-day, same-sport workouts/i)
    ).toBeInTheDocument();
  });
});

describe("MatchToPicker — keyboard navigation", () => {
  const setup = () => {
    const onSelect = vi.fn();
    const onClose = vi.fn();
    const workouts = [
      makeWorkout("w1", "cycling", 60 * 60),
      makeWorkout("w2", "cycling", 90 * 60),
      makeWorkout("w3", "cycling"),
    ];
    render(
      <MatchToPicker
        workouts={workouts}
        pending={false}
        onSelect={onSelect}
        onClose={onClose}
      />
    );
    return { onSelect, onClose };
  };

  it("should auto-focus the first list item on mount", () => {
    setup();

    const firstOption = screen.getAllByRole("option")[0]!;
    expect(firstOption).toHaveFocus();
    expect(firstOption.getAttribute("aria-selected")).toBe("true");
  });

  it("should move focus on ArrowDown to next, ArrowUp back, both wrapping", () => {
    setup();
    const listbox = screen.getByRole("listbox");
    const options = screen.getAllByRole("option");

    fireEvent.keyDown(listbox, { key: "ArrowDown" });
    expect(options[1]).toHaveFocus();

    fireEvent.keyDown(listbox, { key: "ArrowDown" });
    expect(options[2]).toHaveFocus();

    fireEvent.keyDown(listbox, { key: "ArrowDown" });
    expect(options[0]).toHaveFocus(); // wrap to start

    fireEvent.keyDown(listbox, { key: "ArrowUp" });
    expect(options[2]).toHaveFocus(); // wrap to end
  });

  it("should select the focused item on Enter via onSelect(workoutId)", () => {
    const { onSelect } = setup();
    const listbox = screen.getByRole("listbox");

    fireEvent.keyDown(listbox, { key: "ArrowDown" }); // focus w2

    const focused = document.activeElement as HTMLButtonElement | null;
    expect(focused).not.toBeNull();
    fireEvent.click(focused!);

    expect(onSelect).toHaveBeenCalledWith("w2");
  });

  it("should close the picker on Escape via onClose without bubbling", () => {
    const { onClose } = setup();
    const listbox = screen.getByRole("listbox");

    fireEvent.keyDown(listbox, { key: "Escape" });

    expect(onClose).toHaveBeenCalledTimes(1);
  });
});

describe("MatchToPicker — pending state", () => {
  it("should disable every option while a selection is in flight", () => {
    render(
      <MatchToPicker
        workouts={[makeWorkout("w1", "cycling")]}
        pending={true}
        onSelect={vi.fn()}
        onClose={vi.fn()}
      />
    );

    const option = screen.getByRole("option");
    expect(option).toBeDisabled();
  });
});
