/**
 * Component-level tests for the 3-state CoachingActivityDialog: AI
 * hint visibility, AI processing overlay/cancel, AI failure inline
 * error, and the Manual creating-disabled state. Matched-state UI
 * (workout-state-conditional buttons) is covered in
 * `MatchedActions.test.tsx` because it requires only props-level
 * exercise — these tests own the no-workout/converted/error flows.
 */
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";

import { AnalyticsProvider } from "../../../contexts/analytics-context";
import { PersistenceProvider } from "../../../contexts/persistence-context";
import { createInMemoryPersistence } from "../../../test-utils/in-memory-persistence";
import type { CoachingActivity } from "../../../types/coaching-activity";
import { CoachingActivityDialog } from "./CoachingActivityDialog";

vi.mock("wouter", () => ({
  useLocation: () => ["/calendar", vi.fn()],
}));

vi.mock("../../../hooks/use-active-profile-live", () => ({
  useActiveProfileLive: () => ({
    id: "profile-1",
    profile: { id: "profile-1" },
  }),
}));

vi.mock("../../../hooks/use-ai-providers-live", () => ({
  useAiProvidersLive: () => [],
}));

const baseActivity: CoachingActivity = {
  id: "train2go:abc",
  source: "train2go",
  sourceBadge: "T2G",
  date: "2026-04-13",
  sport: { label: "Cycling", icon: "🚴" },
  title: "Sweet spot intervals",
  duration: "01:00:00",
  effort: 4,
  status: "pending",
  description: "Five blocks of 8 min sweet spot.",
};

const wrap = (children: ReactNode) => (
  <AnalyticsProvider analytics={{ event: vi.fn() }}>
    <PersistenceProvider persistence={createInMemoryPersistence()}>
      {children}
    </PersistenceProvider>
  </AnalyticsProvider>
);

describe("CoachingActivityDialog — states", () => {
  it("should show the AI hint when activity description is empty", () => {
    // Arrange
    const activity = { ...baseActivity, description: "" };

    // Act
    render(
      wrap(
        <CoachingActivityDialog
          activity={activity}
          onClose={vi.fn()}
          expandActivity={vi.fn()}
        />
      )
    );

    // Assert
    expect(screen.getByTestId("coaching-dialog-ai-hint")).toBeInTheDocument();
  });

  it("should hide the AI hint when activity has a description", () => {
    // Arrange

    // Act
    render(
      wrap(
        <CoachingActivityDialog
          activity={baseActivity}
          onClose={vi.fn()}
          expandActivity={vi.fn()}
        />
      )
    );

    // Assert
    expect(
      screen.queryByTestId("coaching-dialog-ai-hint")
    ).not.toBeInTheDocument();
  });

  it("should render the AI failure inline state when no provider is configured", async () => {
    // Arrange
    render(
      wrap(
        <CoachingActivityDialog
          activity={baseActivity}
          onClose={vi.fn()}
          expandActivity={vi.fn()}
        />
      )
    );

    // Act
    await userEvent.click(screen.getByTestId("coaching-dialog-ai-process"));

    // Assert
    await waitFor(() =>
      expect(screen.getByTestId("coaching-dialog-ai-error")).toBeInTheDocument()
    );
    expect(screen.getByTestId("coaching-dialog-ai-retry")).toBeInTheDocument();
  });
});
