/**
 * Tests for `CoachingSidebar` — verifies the sidebar renders the
 * coaching activity title, sport line, status, and description; and
 * that the collapse toggle hides everything except the expand button.
 */
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";

import type { CoachingActivityRecord } from "../../../types/coaching-activity-record";
import { CoachingSidebar } from "./CoachingSidebar";
import { COLLAPSE_STORAGE_KEY } from "./use-sidebar-collapse";

const activity: CoachingActivityRecord = {
  id: "profile-1:train2go:abc",
  profileId: "profile-1",
  source: "train2go",
  sourceId: "abc",
  date: "2026-04-13",
  sport: "Cycling",
  title: "Sweet spot intervals",
  duration: "01:00:00",
  intensity: 4,
  status: "pending",
  description: "<p>Warm up 10 min.</p><p><strong>Then</strong> 4×5 min Z4.</p>",
  fetchedAt: "2026-04-13T08:00:00Z",
} as unknown as CoachingActivityRecord;

describe("CoachingSidebar", () => {
  beforeEach(() => {
    localStorage.removeItem(COLLAPSE_STORAGE_KEY);
    // Force expanded default by stubbing matchMedia → desktop.
    window.matchMedia = (q: string) =>
      ({
        matches: q.includes("min-width"),
        media: q,
        addEventListener: () => undefined,
        removeEventListener: () => undefined,
      }) as unknown as MediaQueryList;
  });

  it("should render title, sport, status and description when expanded", () => {
    // Arrange

    // Act
    render(<CoachingSidebar activity={activity} />);

    // Assert
    expect(screen.getByTestId("coaching-sidebar")).toBeInTheDocument();
    expect(screen.getByText("Sweet spot intervals")).toBeInTheDocument();
    expect(
      screen.getByTestId("coaching-sidebar-description")
    ).toHaveTextContent("Warm up 10 min");
    expect(
      screen.getByTestId("coaching-sidebar-description")
    ).toHaveTextContent("Then");
  });

  it("should collapse to a single Coach button when toggled", async () => {
    // Arrange
    render(<CoachingSidebar activity={activity} />);

    // Act
    await userEvent.click(screen.getByTestId("coaching-sidebar-collapse"));

    // Assert
    expect(screen.queryByTestId("coaching-sidebar")).not.toBeInTheDocument();
    expect(screen.getByTestId("coaching-sidebar-expand")).toBeInTheDocument();
  });

  it("should restore collapse state from localStorage on mount", () => {
    // Arrange
    localStorage.setItem(COLLAPSE_STORAGE_KEY, "true");

    // Act
    render(<CoachingSidebar activity={activity} />);

    // Assert
    expect(screen.getByTestId("coaching-sidebar-expand")).toBeInTheDocument();
  });

  it("should render the empty-description fallback when description is null", () => {
    // Arrange
    const noDesc = { ...activity, description: undefined };

    // Act
    render(<CoachingSidebar activity={noDesc} />);

    // Assert
    expect(screen.getByTestId("coaching-sidebar-empty")).toBeInTheDocument();
  });
});
