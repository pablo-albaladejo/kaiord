import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";

import { PersistenceProvider } from "../../../contexts/persistence-context";
import { createInMemoryPersistence } from "../../../test-utils/in-memory-persistence";
import type { CoachingActivity } from "../../../types/coaching-activity";
import { CoachingActivityDialog } from "./CoachingActivityDialog";

const mockNavigate = vi.fn();

vi.mock("wouter", () => ({
  useLocation: () => ["/calendar", mockNavigate],
}));

vi.mock("../../../hooks/use-active-profile-live", () => ({
  useActiveProfileLive: () => ({ id: null, profile: null }),
}));

const baseActivity: CoachingActivity = {
  id: "train2go:12345",
  source: "train2go",
  sourceBadge: "T2G",
  date: "2026-04-13",
  sport: { label: "Cycling", icon: "🚴" },
  title: "FTP test",
  duration: "01:00:00",
  effort: 4,
  status: "pending",
  description: "Warm up 10 min easy, then ramp.",
};

const wrap = (children: ReactNode) => (
  <PersistenceProvider persistence={createInMemoryPersistence()}>
    {children}
  </PersistenceProvider>
);

describe("CoachingActivityDialog", () => {
  it("should return null when no activity is selected", () => {
    // Arrange

    // Act

    const { container } = render(
      wrap(
        <CoachingActivityDialog
          activity={null}
          onClose={vi.fn()}
          expandActivity={vi.fn()}
        />
      )
    );

    // Assert

    expect(container.firstChild).toBeNull();
  });

  it("should render title, sport, duration and description when activity has them", () => {
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

    expect(screen.getByText("FTP test")).toBeInTheDocument();
    expect(screen.getByText("Cycling")).toBeInTheDocument();
    expect(screen.getByText(/01:00:00/)).toBeInTheDocument();
    expect(
      screen.getByText("Warm up 10 min easy, then ramp.")
    ).toBeInTheDocument();
  });

  it("should show the loading description placeholder when description is undefined", () => {
    // Arrange

    // Act

    render(
      wrap(
        <CoachingActivityDialog
          activity={{ ...baseActivity, description: undefined }}
          onClose={vi.fn()}
          expandActivity={vi.fn()}
        />
      )
    );

    // Assert

    expect(
      screen.getByTestId("coaching-dialog-description-loading")
    ).toBeInTheDocument();
  });

  it("should not show the loading placeholder for known-empty description ('')", () => {
    // Arrange

    // Act

    render(
      wrap(
        <CoachingActivityDialog
          activity={{ ...baseActivity, description: "" }}
          onClose={vi.fn()}
          expandActivity={vi.fn()}
        />
      )
    );

    // Assert

    expect(
      screen.queryByTestId("coaching-dialog-description-loading")
    ).not.toBeInTheDocument();
  });

  it("should call onClose when Close button is clicked", async () => {
    // Arrange

    const onClose = vi.fn();
    render(
      wrap(
        <CoachingActivityDialog
          activity={baseActivity}
          onClose={onClose}
          expandActivity={vi.fn()}
        />
      )
    );

    // Act

    await userEvent.click(screen.getByText("Close"));

    // Assert

    expect(onClose).toHaveBeenCalled();
  });

  it("should render the no-workout AI/Manual/Match buttons in solo mode", () => {
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

    const aiBtn = screen.getByTestId("coaching-dialog-ai-process");
    const manualBtn = screen.getByTestId("coaching-dialog-edit-manually");
    const matchBtn = screen.getByTestId("coaching-dialog-match-existing");

    // Assert

    expect(aiBtn).toBeEnabled();
    expect(manualBtn).toBeEnabled();
    expect(matchBtn).toBeEnabled();
  });
});
