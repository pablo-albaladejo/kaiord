/**
 * DayColumn wellness-band integration: present/absent rendering, the
 * always-visible `+ Add` affordance, and the drag invariants from the
 * design Risks section — a badge/`+` pointerdown does not start a drag,
 * and a drop onto a band-bearing cell still hit-tests to the day via
 * `[data-day]`.
 */
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { Router } from "wouter";
import { memoryLocation } from "wouter/memory-location";

import type { WorkoutRecord } from "../../../types/calendar-record";
import type { DayWellness } from "../../../types/health/day-wellness";
import { DayColumn } from "./DayColumn";

const DATE = "2026-05-19";

function makeWorkout(): WorkoutRecord {
  return {
    id: "w1",
    date: DATE,
    sport: "running",
    source: "kaiord",
    sourceId: null,
    planId: null,
    state: "raw",
    raw: {
      title: "Easy run",
      description: "",
      comments: [],
      distance: null,
      duration: { value: 1800, unit: "s" },
      prescribedRpe: null,
      rawHash: "abc",
    },
    krd: null,
    lastProcessingError: null,
    feedback: null,
    aiMeta: null,
    garminPushId: null,
    tags: [],
    previousState: null,
    createdAt: "2026-05-19T08:00:00.000Z",
    modifiedAt: null,
    updatedAt: "2026-05-19T08:00:00.000Z",
  };
}

function renderColumn(
  wellness: DayWellness | undefined,
  extra: Partial<Parameters<typeof DayColumn>[0]> = {}
) {
  const loc = memoryLocation({ path: "/calendar", record: true });
  return render(
    <Router hook={loc.hook}>
      <DayColumn
        date={DATE}
        isToday={false}
        onWorkoutClick={vi.fn()}
        onAddClick={vi.fn()}
        wellness={wellness}
        {...extra}
      />
    </Router>
  );
}

describe("DayColumn wellness band", () => {
  it("should render the band above the cards when wellness is present", () => {
    // Arrange
    const wellness: DayWellness = { sleep: "82" };

    // Act
    renderColumn(wellness);

    // Assert
    expect(screen.getByTestId("wellness-band")).toBeInTheDocument();
    expect(screen.getByTestId("wellness-badge-sleep")).toBeInTheDocument();
  });

  it("should render no band when wellness is undefined", () => {
    // Arrange
    const wellness = undefined;

    // Act
    renderColumn(wellness);

    // Assert
    expect(screen.queryByTestId("wellness-band")).not.toBeInTheDocument();
  });

  it("should thread wellnessResolved through to the explicit empty marker", () => {
    // Arrange

    // Act
    renderColumn(undefined, { wellnessResolved: true });

    // Assert
    expect(screen.getByTestId("wellness-band-empty")).toBeInTheDocument();
  });

  it("should render the + Add affordance on an empty day", () => {
    // Arrange
    const wellness: DayWellness = { sleep: "82" };

    // Act
    renderColumn(wellness);

    // Assert
    expect(screen.getByTestId(`empty-day-${DATE}`)).toBeInTheDocument();
  });

  it("should render the + Add affordance on a day that already has a workout", () => {
    // Arrange
    const wellness: DayWellness = { sleep: "82" };

    // Act
    renderColumn(wellness, { soloActuals: [makeWorkout()] });

    // Assert
    expect(screen.getByTestId(`empty-day-${DATE}`)).toBeInTheDocument();
  });

  it("should not start a drag when the + Add button is pressed", () => {
    // Arrange
    const dragHandler = vi.fn();
    const bind = vi.fn(() => () => dragHandler());
    renderColumn(
      { sleep: "82" },
      { soloActuals: [makeWorkout()], workoutCardPointerDownFor: bind }
    );
    const addButton = screen.getByTestId(`empty-day-${DATE}`);

    // Act
    fireEvent.pointerDown(addButton);

    // Assert
    expect(dragHandler).not.toHaveBeenCalled();
  });

  it("should not bind a drag handler to the wellness badge", () => {
    // Arrange
    const dragHandler = vi.fn();
    const bind = vi.fn(() => () => dragHandler());
    renderColumn(
      { sleep: "82" },
      { soloActuals: [makeWorkout()], workoutCardPointerDownFor: bind }
    );
    const badge = screen.getByTestId("wellness-badge-sleep");

    // Act
    fireEvent.pointerDown(badge);

    // Assert
    expect(dragHandler).not.toHaveBeenCalled();
  });

  it("should keep the band inside the day cell so a drop hit-tests to the day", () => {
    // Arrange
    renderColumn({ sleep: "82" });
    const band = screen.getByTestId("wellness-band");

    // Act
    const dayRoot = band.closest("[data-day]");

    // Assert
    expect(dayRoot).not.toBeNull();
    expect(dayRoot?.getAttribute("data-day")).toBe(DATE);
  });
});
