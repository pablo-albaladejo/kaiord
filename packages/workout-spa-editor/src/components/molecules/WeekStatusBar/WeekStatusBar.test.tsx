import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import type { WeekStatus } from "../../pages/week-status";
import { WeekStatusBar } from "./WeekStatusBar";

const DONE = 2;
const READY = 3;
const RAW = 4;

const BUSY_WEEK: WeekStatus = {
  doneAndMatched: DONE,
  readyNotPushed: READY,
  needsStructure: RAW,
};

const SILENT_WEEK: WeekStatus = {
  doneAndMatched: 0,
  readyNotPushed: 0,
  needsStructure: 0,
};

describe("WeekStatusBar", () => {
  it("should state every count as text, not only as a bar width", () => {
    // Arrange

    // Act
    render(<WeekStatusBar status={BUSY_WEEK} />);

    // Assert
    expect(screen.getByText(`${DONE} done and matched`)).toBeInTheDocument();
    expect(screen.getByText(`${READY} ready, not pushed`)).toBeInTheDocument();
    expect(screen.getByText(`${RAW} need structure`)).toBeInTheDocument();
  });

  it("should say how much is waiting to reach the watch", () => {
    // Arrange

    // Act
    render(<WeekStatusBar status={BUSY_WEEK} />);

    // Assert
    expect(
      screen.getByText(`${READY} waiting to go to your watch`)
    ).toBeInTheDocument();
  });

  it("should agree with itself when a count is one", () => {
    // Arrange
    const single: WeekStatus = { ...SILENT_WEEK, needsStructure: 1 };

    // Act
    render(<WeekStatusBar status={single} />);

    // Assert
    expect(screen.getByText("1 needs structure")).toBeInTheDocument();
  });

  it("should say nothing about a week with nothing to report", () => {
    // Arrange

    // Act
    render(<WeekStatusBar status={SILENT_WEEK} />);

    // Assert
    expect(screen.queryByTestId("week-status-bar")).not.toBeInTheDocument();
  });

  it("should not claim anything is waiting when nothing is ready", () => {
    // Arrange
    const noneReady: WeekStatus = { ...BUSY_WEEK, readyNotPushed: 0 };

    // Act
    render(<WeekStatusBar status={noneReady} />);

    // Assert
    expect(screen.queryByText(/waiting to go to your watch/)).toBeNull();
  });
});
