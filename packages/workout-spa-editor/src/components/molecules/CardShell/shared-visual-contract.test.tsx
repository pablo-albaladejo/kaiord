import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import type { WorkoutRecord } from "../../../types/calendar-record";
import type { CoachingActivity } from "../../../types/coaching-activity";
import { CoachingActivityCard } from "../CoachingCard/CoachingActivityCard";
import {
  type MatchedSession,
  MatchedSessionCard,
} from "../MatchedSessionCard/MatchedSessionCard";
import { WorkoutCard } from "../WorkoutCard/WorkoutCard";

const activity: CoachingActivity = {
  id: "a1",
  source: "train2go",
  sourceBadge: "T2G",
  date: "2026-04-29",
  sport: { label: "Cycling", icon: "\u{1F6B4}" },
  title: "Plan",
  duration: "60 min",
  effort: 3,
  status: "completed", // emerald-600
};

const workout: WorkoutRecord = {
  id: "w1",
  date: "2026-04-29",
  state: "ready", // emerald-600
  source: "manual",
  sourceId: null,
  planId: null,
  sport: "cycling",
  raw: {
    title: "Actual",
    description: "",
    comments: [],
    distance: null,
    duration: { value: 3600, unit: "s" },
    prescribedRpe: null,
    rawHash: "h",
  },
  krd: null,
  lastProcessingError: null,
  feedback: null,
  aiMeta: null,
  garminPushId: null,
  tags: [],
  previousState: null,
  createdAt: "2026-04-29T10:00:00.000Z",
  modifiedAt: null,
  updatedAt: "2026-04-29T10:00:00.000Z",
};

const matched: MatchedSession = {
  activity,
  workout,
  complianceScore: 0.95, // emerald
};

describe("Shared visual contract across card variants", () => {
  it("all three cards render the same lateral border width (border-l-4)", () => {
    const { rerender } = render(<CoachingActivityCard activity={activity} />);
    expect(screen.getByTestId("coaching-card-a1").className).toContain(
      "border-l-4"
    );

    rerender(<WorkoutCard workout={workout} onClick={() => undefined} />);
    expect(screen.getByTestId("workout-card-w1").className).toContain(
      "border-l-4"
    );

    rerender(<MatchedSessionCard session={matched} />);
    expect(screen.getByTestId("matched-card-a1").className).toContain(
      "border-l-4"
    );
  });

  it("all three render the same emerald token when status / state / score align", () => {
    const { rerender } = render(<CoachingActivityCard activity={activity} />);
    expect(screen.getByTestId("coaching-card-a1").className).toContain(
      "border-emerald-600"
    );

    rerender(<WorkoutCard workout={workout} onClick={() => undefined} />);
    expect(screen.getByTestId("workout-card-w1").className).toContain(
      "border-emerald-600"
    );

    rerender(<MatchedSessionCard session={matched} />);
    expect(screen.getByTestId("matched-card-a1").className).toContain(
      "border-emerald-600"
    );
  });
});
