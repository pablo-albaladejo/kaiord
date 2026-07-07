import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { activityToWorkoutRecord } from "../../../application/coaching/activity-to-workout-record";
import { buildSourceActivityRecord } from "../../../types/activity-record";
import type { WorkoutRecord } from "../../../types/calendar-record";
import { renderDayCards } from "./day-column-cards";

const realWorkout = (): WorkoutRecord =>
  ({
    id: "w-real",
    date: "2026-04-06",
    sport: "running",
    source: "kaiord",
    state: "structured",
    raw: null,
  }) as unknown as WorkoutRecord;

const projectedWorkout = () =>
  activityToWorkoutRecord(
    buildSourceActivityRecord({
      profileId: "p1",
      date: "2026-04-06",
      sport: "running",
      sourceBridgeId: "garmin-bridge",
      externalId: "ext-1",
    })
  );

describe("renderDayCards", () => {
  it("should wire drag binding for a real workout but not for a projected activity", () => {
    // Arrange
    const bind = vi.fn(() => vi.fn());
    const activity = projectedWorkout();

    // Act
    render(
      <>
        {renderDayCards({
          matchedSessions: [],
          soloPlans: [],
          soloActuals: [realWorkout(), activity],
          view: "grid",
          onWorkoutClick: vi.fn(),
          workoutCardPointerDownFor: bind,
        })}
      </>
    );

    // Assert
    expect(bind).toHaveBeenCalledTimes(1);
    expect(bind).toHaveBeenCalledWith("w-real");
    expect(bind).not.toHaveBeenCalledWith(activity.id);
  });

  it("should still forward clicks on a projected activity card", async () => {
    // Arrange
    const onWorkoutClick = vi.fn();
    const activity = projectedWorkout();
    const user = userEvent.setup();

    // Act
    render(
      <>
        {renderDayCards({
          matchedSessions: [],
          soloPlans: [],
          soloActuals: [activity],
          view: "grid",
          onWorkoutClick,
          workoutCardPointerDownFor: vi.fn(() => vi.fn()),
        })}
      </>
    );
    await user.click(screen.getByTestId(`workout-card-${activity.id}`));

    // Assert
    expect(onWorkoutClick).toHaveBeenCalledWith(activity);
  });
});
