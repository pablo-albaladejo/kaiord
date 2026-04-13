import { describe, expect, it } from "vitest";

import type { WorkoutComment } from "../../../types/calendar-fragments";
import { getPreSelectedComments } from "./raw-workout-hooks";

describe("getPreSelectedComments", () => {
  const workoutDate = "2026-04-06";

  it("pre-selects comments before noon", () => {
    const comments: WorkoutComment[] = [
      {
        author: "Coach",
        text: "Morning brief",
        timestamp: "2026-04-06T08:00:00.000Z",
      },
      {
        author: "Coach",
        text: "Afternoon update",
        timestamp: "2026-04-06T14:00:00.000Z",
      },
    ];

    const selected = getPreSelectedComments(comments, workoutDate);

    expect(selected.has(0)).toBe(true);
    expect(selected.has(1)).toBe(false);
  });

  it("returns empty set for no comments", () => {
    const selected = getPreSelectedComments([], workoutDate);

    expect(selected.size).toBe(0);
  });

  it("pre-selects by timestamp relative to workout date noon", () => {
    const comments: WorkoutComment[] = [
      {
        author: "Coach",
        text: "Pre-workout brief",
        timestamp: "2026-04-05T20:00:00.000Z",
      },
      {
        author: "Coach",
        text: "Morning update",
        timestamp: "2026-04-06T07:30:00.000Z",
      },
      {
        author: "Coach",
        text: "Exactly at noon",
        timestamp: "2026-04-06T12:00:00.000Z",
      },
      {
        author: "Athlete",
        text: "Post-workout feedback",
        timestamp: "2026-04-06T18:00:00.000Z",
      },
    ];

    const selected = getPreSelectedComments(comments, workoutDate);

    // Day before and morning are pre-selected
    expect(selected.has(0)).toBe(true);
    expect(selected.has(1)).toBe(true);
    // Exactly noon and after are NOT pre-selected
    expect(selected.has(2)).toBe(false);
    expect(selected.has(3)).toBe(false);
    expect(selected.size).toBe(2);
  });

  it("selects all pre-noon comments", () => {
    const comments: WorkoutComment[] = [
      { author: "A", text: "Early", timestamp: "2026-04-06T06:00:00.000Z" },
      {
        author: "B",
        text: "Also early",
        timestamp: "2026-04-06T11:59:00.000Z",
      },
    ];

    const selected = getPreSelectedComments(comments, workoutDate);

    expect(selected.size).toBe(2);
  });
});
