/**
 * Grid drag on matched cards (design §3.8, AC-11): a movable matched card is
 * bound by its workout id; an executed, completed or projected session, and
 * an unconverted plan, get no binding.
 */
import { render } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import {
  coachWorkout,
  sessionMatch,
} from "../../../application/session-move.test-fixtures";
import type { MatchedSessionWithMetadata } from "../../../hooks/use-matched-sessions";
import type { CoachingActivity } from "../../../types/coaching-activity";
import { renderDayCards } from "./day-column-cards";

const plan = (overrides: Partial<CoachingActivity> = {}): CoachingActivity => ({
  id: "train2go:77",
  source: "train2go",
  sourceBadge: "T2G",
  date: "2026-10-06",
  sport: { label: "Bike", icon: "🚴" },
  title: "Threshold",
  status: "pending",
  ...overrides,
});

const matched = (
  id: string,
  overrides: Partial<MatchedSessionWithMetadata> = {}
): MatchedSessionWithMetadata => ({
  activity: plan({ id: `train2go:${id}` }),
  workout: coachWorkout({ id }),
  complianceScore: null,
  executed: [],
  match: sessionMatch({ id: `m-${id}`, workoutId: id }),
  ...overrides,
});

const renderWith = (
  matchedSessions: MatchedSessionWithMetadata[],
  soloPlans: CoachingActivity[] = []
) => {
  const bind = vi.fn(() => vi.fn());
  render(
    <>
      {renderDayCards({
        matchedSessions,
        soloPlans,
        soloActuals: [],
        view: "grid",
        onWorkoutClick: vi.fn(),
        workoutCardPointerDownFor: bind,
      })}
    </>
  );
  return bind;
};

describe("renderDayCards matched drag", () => {
  it("should bind a movable matched card by its workout id", () => {
    // Arrange
    const sessions = [matched("w-move")];

    // Act
    const bind = renderWith(sessions);

    // Assert
    expect(bind).toHaveBeenCalledWith("w-move");
  });

  it("should not bind an executed, completed or projected session", () => {
    // Arrange
    const sessions = [
      matched("w-done", { executed: [coachWorkout({ id: "rec" })] }),
      matched("w-completed", {
        activity: plan({ id: "train2go:c", status: "completed" }),
      }),
      matched("w-projected", {
        workout: {
          ...coachWorkout({ id: "w-projected" }),
          projectedFromActivity: true,
        } as never,
      }),
    ];

    // Act
    const bind = renderWith(sessions);

    // Assert
    expect(bind).not.toHaveBeenCalled();
  });

  it("should never bind an unconverted coach plan", () => {
    // Arrange
    const soloPlans = [plan()];

    // Act
    const bind = renderWith([], soloPlans);

    // Assert
    expect(bind).not.toHaveBeenCalled();
  });
});
