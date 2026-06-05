import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Router } from "wouter";
import { memoryLocation } from "wouter/memory-location";

import type { WeekDay } from "./today-dates";
import { weekDays } from "./today-dates";
import { WeekStrip } from "./WeekStrip";

const DAYS_IN_WEEK = 7;

function renderStrip(days: WeekDay[]) {
  const { hook } = memoryLocation({ path: "/calendar", record: true });
  return render(
    <Router hook={hook}>
      <WeekStrip days={days} workouts={[]} profile={null} />
    </Router>
  );
}

describe("WeekStrip", () => {
  it("should render seven clickable day columns", () => {
    // Arrange
    const days = weekDays(new Date("2024-01-10T12:00:00"));

    // Act
    renderStrip(days);

    // Assert
    expect(screen.getAllByRole("link")).toHaveLength(DAYS_IN_WEEK);
  });

  it("should link each day to its calendar week route", () => {
    // Arrange
    const days = weekDays(new Date("2024-01-10T12:00:00"));

    // Act
    renderStrip(days);

    // Assert
    for (const link of screen.getAllByRole("link")) {
      expect(link.getAttribute("href")).toMatch(/^\/calendar\/\d{4}-W\d{2}$/);
    }
  });
});
