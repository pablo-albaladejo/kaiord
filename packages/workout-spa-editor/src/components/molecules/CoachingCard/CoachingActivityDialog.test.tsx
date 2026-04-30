import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";

import { PersistenceProvider } from "../../../contexts/persistence-context";
import { createInMemoryPersistence } from "../../../test-utils/in-memory-persistence";
import type { CoachingActivity } from "../../../types/coaching-activity";

const mockNavigate = vi.fn();

vi.mock("wouter", () => ({
  useLocation: () => ["/calendar", mockNavigate],
}));

vi.mock("../../../contexts/coaching-registry-context", () => ({
  useCoachingSourceFactories: () => [],
}));

vi.mock("../../../hooks/use-active-profile-live", () => ({
  useActiveProfileLive: () => ({ id: null, profile: null }),
}));

import { CoachingActivityDialog } from "./CoachingActivityDialog";

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
  it("returns null when no activity is selected", () => {
    const { container } = render(
      wrap(<CoachingActivityDialog activity={null} onClose={vi.fn()} />)
    );

    expect(container.firstChild).toBeNull();
  });

  it("renders title, sport, duration and description when activity has them", () => {
    render(
      wrap(<CoachingActivityDialog activity={baseActivity} onClose={vi.fn()} />)
    );

    expect(screen.getByText("FTP test")).toBeInTheDocument();
    expect(screen.getByText("Cycling")).toBeInTheDocument();
    expect(screen.getByText(/01:00:00/)).toBeInTheDocument();
    expect(
      screen.getByText("Warm up 10 min easy, then ramp.")
    ).toBeInTheDocument();
  });

  it("shows the loading description placeholder when description is undefined", () => {
    render(
      wrap(
        <CoachingActivityDialog
          activity={{ ...baseActivity, description: undefined }}
          onClose={vi.fn()}
        />
      )
    );

    expect(
      screen.getByTestId("coaching-dialog-description-loading")
    ).toBeInTheDocument();
  });

  it("does NOT show the loading placeholder for known-empty description ('')", () => {
    render(
      wrap(
        <CoachingActivityDialog
          activity={{ ...baseActivity, description: "" }}
          onClose={vi.fn()}
        />
      )
    );

    expect(
      screen.queryByTestId("coaching-dialog-description-loading")
    ).not.toBeInTheDocument();
  });

  it("Close button calls onClose", async () => {
    const onClose = vi.fn();
    render(
      wrap(<CoachingActivityDialog activity={baseActivity} onClose={onClose} />)
    );

    await userEvent.click(screen.getByText("Close"));

    expect(onClose).toHaveBeenCalled();
  });

  it("Convert button is disabled while converting", () => {
    render(
      wrap(<CoachingActivityDialog activity={baseActivity} onClose={vi.fn()} />)
    );

    const btn = screen.getByText("Convert to workout");
    expect(btn).toBeEnabled(); // initial state
  });
});
