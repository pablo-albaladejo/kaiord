/**
 * Pace is typed the way athletes say it — m:ss per km, or per 100 m in the
 * pool — while the KRD keeps m/s. The sport comes from the workout being
 * edited, so the store is seeded with one.
 */
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useWorkoutStore } from "../../../store/workout-store";
import type { KRD, Target } from "../../../types/krd";
import { TargetPicker } from "./TargetPicker";

const loadSport = (sport: "running" | "swimming") => {
  const krd: KRD = {
    version: "1.0",
    type: "structured_workout",
    metadata: { created: "2026-10-11T00:00:00Z", sport },
    extensions: { structured_workout: { sport, steps: [] } },
  };
  useWorkoutStore.getState().loadWorkout(krd);
};

const pickPace = async (user: ReturnType<typeof userEvent.setup>) => {
  await user.selectOptions(screen.getByLabelText("Select target type"), "pace");
};

describe("TargetPicker pace", () => {
  beforeEach(() => {
    loadSport("running");
  });

  it("should take a running pace in min/km and store it in m/s", async () => {
    // Arrange
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<TargetPicker value={null} onChange={onChange} />);
    await pickPace(user);

    // Act
    await user.type(screen.getByLabelText("Pace (min/km)"), "4:30");

    // Assert
    expect(onChange).toHaveBeenLastCalledWith({
      type: "pace",
      value: { unit: "mps", value: 3.704 },
    });
  });

  it("should show a stored m/s as the pace it stands for", () => {
    // Arrange
    const value: Target = {
      type: "pace",
      value: { unit: "mps", value: 3.704 },
    };

    // Act
    render(<TargetPicker value={value} onChange={vi.fn()} />);

    // Assert
    expect(screen.getByLabelText("Pace (min/km)")).toHaveValue("4:30");
  });

  it("should reject a pace that is not m:ss", async () => {
    // Arrange
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<TargetPicker value={null} onChange={onChange} />);
    await pickPace(user);

    // Act
    await user.type(screen.getByLabelText("Pace (min/km)"), "3.2");

    // Assert
    expect(onChange).toHaveBeenLastCalledWith(null);
    expect(screen.getByText(/enter a pace as m:ss/i)).toBeInTheDocument();
  });

  it("should order a pace range however its ends are typed", async () => {
    // Arrange
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<TargetPicker value={null} onChange={onChange} />);
    await pickPace(user);
    await user.selectOptions(screen.getByLabelText(/unit/i), "range");

    // Act
    await user.type(screen.getByLabelText("Minimum value"), "4:40");
    await user.type(screen.getByLabelText("Maximum value"), "4:20");

    // Assert
    expect(onChange).toHaveBeenLastCalledWith({
      type: "pace",
      value: { unit: "range", min: 3.571, max: 3.846 },
    });
  });

  it("should pace a swim per 100 m", async () => {
    // Arrange
    loadSport("swimming");
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<TargetPicker value={null} onChange={onChange} />);
    await pickPace(user);

    // Act
    await user.type(screen.getByLabelText("Pace (min/100 m)"), "1:45");

    // Assert
    expect(onChange).toHaveBeenLastCalledWith({
      type: "pace",
      value: { unit: "mps", value: 0.952 },
    });
  });
});
