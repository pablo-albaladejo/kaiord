import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import type { HealthSleepRecord } from "../../../types/health/health-records";
import { SleepNightRow } from "./SleepNightRow";

const record = (krd: Partial<HealthSleepRecord["krd"]>): HealthSleepRecord => ({
  id: "s1",
  profileId: "p1",
  date: "2026-10-10",
  sourceBridgeId: "manual",
  krd: {
    kind: "sleep",
    version: "2.0",
    startTime: "2026-10-10T12:00:00.000Z",
    endTime: "2026-10-10T12:00:00.000Z",
    stages: [],
    ...krd,
  },
});

describe("SleepNightRow", () => {
  it("should show a recorded night as hours and minutes", () => {
    // Arrange
    const night = record({ totalDurationSeconds: 27000, score: 81 });

    // Act
    render(<SleepNightRow record={night} />);

    // Assert
    expect(screen.getByText("7 h 30 m")).toBeInTheDocument();
    expect(screen.getByText("Score 81")).toBeInTheDocument();
  });

  it("should show a legacy score-only entry as duration not recorded", () => {
    // Arrange
    const night = record({ totalDurationSeconds: 0, score: 81 });

    // Act
    render(<SleepNightRow record={night} />);

    // Assert
    expect(screen.getByText("Duration not recorded")).toBeInTheDocument();
    expect(screen.queryByText("0 h 0 m")).not.toBeInTheDocument();
  });
});
