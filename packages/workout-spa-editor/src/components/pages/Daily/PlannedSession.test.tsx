import { screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { Router } from "wouter";
import { memoryLocation } from "wouter/memory-location";

import { renderWithProviders } from "../../../test-utils";
import type { WorkoutRecord } from "../../../types/calendar-record";
import type { CoachingActivity } from "../../../types/coaching-activity";
import type { TodayBuckets } from "./build-today-buckets";
import { PlannedSession } from "./PlannedSession";

const EMPTY: TodayBuckets = {
  matchedSessions: [],
  soloPlans: [],
  soloActuals: [],
};

const activity = (o: Partial<CoachingActivity> = {}): CoachingActivity => ({
  id: "a-1",
  source: "train2go",
  sourceBadge: "T2G",
  date: "2026-04-29",
  sport: { label: "Swim", icon: "swim" },
  title: "Swim 1500m",
  status: "pending",
  ...o,
});

const workout = (o: Partial<WorkoutRecord> = {}): WorkoutRecord =>
  ({
    id: "w-1",
    date: "2026-04-29",
    sport: "cycling",
    source: "train2go",
    sourceId: "p1:1",
    state: "raw",
    krd: null,
    raw: { title: "FTP intervals" },
    ...o,
  }) as WorkoutRecord;

function render(buckets: TodayBuckets) {
  const { hook } = memoryLocation({ path: "/today", record: true });
  return renderWithProviders(
    <Router hook={hook}>
      <PlannedSession
        buckets={buckets}
        onWorkoutClick={vi.fn()}
        onActivityClick={vi.fn()}
      />
    </Router>
  );
}

describe("PlannedSession", () => {
  it("should list coaching activities planned for today", () => {
    // Arrange
    const buckets: TodayBuckets = { ...EMPTY, soloPlans: [activity()] };

    // Act
    render(buckets);

    // Assert
    expect(screen.getByText("Swim 1500m")).toBeInTheDocument();
    expect(screen.queryByText("Nothing planned today")).not.toBeInTheDocument();
  });

  it("should render a KRD-less workout without gating on its KRD", () => {
    // Arrange
    const buckets: TodayBuckets = { ...EMPTY, soloActuals: [workout()] };

    // Act
    render(buckets);

    // Assert
    expect(screen.getByText("FTP intervals")).toBeInTheDocument();
  });

  it("should show the empty state only when every bucket is empty", () => {
    // Arrange
    const buckets = EMPTY;

    // Act
    render(buckets);

    // Assert
    expect(screen.getByText("Nothing planned today")).toBeInTheDocument();
  });
});
