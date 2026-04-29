import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { CalendarHeader } from "./CalendarHeader";

vi.mock("./CalendarEmptyBanners", () => ({
  CalendarEmptyBanners: () => <div data-testid="mock-empty-banners" />,
}));

vi.mock("../organisms/BatchCostConfirmation", () => ({
  BatchCostConfirmation: ({ open }: { open: boolean }) => (
    <div data-testid="mock-cost-confirmation" data-open={open} />
  ),
}));

vi.mock("../molecules/WorkoutCard/WeekNavigation", () => ({
  WeekNavigation: ({ weekId }: { weekId: string }) => (
    <div data-testid="mock-week-nav">{weekId}</div>
  ),
}));

vi.mock("../molecules/CoachingCard/CoachingSyncButton", () => ({
  CoachingSyncButton: ({
    label,
    onSync,
  }: {
    label: string;
    onSync: () => void;
  }) => (
    <button data-testid={`mock-sync-${label}`} onClick={onSync}>
      {label}
    </button>
  ),
}));

const baseState = {
  data: {
    weekId: "2026-W16",
    rawCount: 2,
    days: ["2026-04-13"],
  },
  batch: {
    message: null,
    dismissMessage: vi.fn(),
    isProcessing: false,
    progress: null,
    requestStart: vi.fn(),
    cancel: vi.fn(),
    pending: null,
    confirmStart: vi.fn(),
    cancelRequest: vi.fn(),
  },
  hasAnyWorkouts: true,
  hasWeekWorkouts: true,
  hasReadyWorkouts: false,
  hasAiProvider: true,
  extensionInstalled: true,
  latestWorkout: null,
  handleGoToLatest: vi.fn(),
  // biome-ignore — partial type for test
} as unknown as Parameters<typeof CalendarHeader>[0]["state"];

describe("CalendarHeader", () => {
  it("renders empty banners, cost confirmation, and week navigation", () => {
    render(
      <CalendarHeader
        state={baseState}
        coaching={
          {
            syncSources: [],
          } as unknown as Parameters<typeof CalendarHeader>[0]["coaching"]
        }
      />
    );

    expect(screen.getByTestId("mock-empty-banners")).toBeInTheDocument();
    expect(screen.getByTestId("mock-cost-confirmation")).toBeInTheDocument();
    expect(screen.getByTestId("mock-week-nav")).toHaveTextContent("2026-W16");
  });

  it("renders a sync button per LINKED coaching source (gates on linked)", () => {
    const coaching = {
      syncSources: [
        {
          id: "s1",
          linked: true,
          connected: true,
          loading: false,
          error: null,
          sync: vi.fn(),
          connect: vi.fn(),
          label: "Garmin",
        },
        {
          id: "s2",
          linked: true,
          connected: false,
          loading: false,
          error: null,
          sync: vi.fn(),
          connect: vi.fn(),
          label: "Train2Go",
        },
        {
          id: "s3",
          linked: false,
          connected: false,
          loading: false,
          error: null,
          sync: vi.fn(),
          connect: vi.fn(),
          label: "Unlinked",
        },
      ],
    } as unknown as Parameters<typeof CalendarHeader>[0]["coaching"];

    render(<CalendarHeader state={baseState} coaching={coaching} />);

    expect(screen.getByTestId("mock-sync-Garmin")).toBeInTheDocument();
    expect(screen.getByTestId("mock-sync-Train2Go")).toBeInTheDocument();
    // The unlinked source must NOT render a Sync button.
    expect(screen.queryByTestId("mock-sync-Unlinked")).not.toBeInTheDocument();
  });

  it("Manual Sync button bypasses staleness gate", async () => {
    // The staleness gate (lastSyncedAt < 10 minutes blocks auto-sync) lives
    // inside useCoachingActivities, NOT inside CalendarHeader. The CalendarHeader
    // wires the Sync button directly to src.sync(weekStart) — clicking it always
    // fires sync, regardless of when the last sync ran.
    const sync = vi.fn();
    const weekStart = "2026-04-13";
    const stateAtWeek = {
      ...baseState,
      data: { ...baseState.data, days: [weekStart] },
    } as unknown as Parameters<typeof CalendarHeader>[0]["state"];
    const coaching = {
      syncSources: [
        {
          id: "train2go",
          linked: true,
          connected: true,
          loading: false,
          error: null,
          sync,
          connect: vi.fn(),
          label: "Train2Go",
        },
      ],
    } as unknown as Parameters<typeof CalendarHeader>[0]["coaching"];
    const user = userEvent.setup();
    render(<CalendarHeader state={stateAtWeek} coaching={coaching} />);

    await user.click(screen.getByTestId("mock-sync-Train2Go"));

    expect(sync).toHaveBeenCalledTimes(1);
    expect(sync).toHaveBeenCalledWith(weekStart);
  });

  it("hides the Sync button when active profile has no linked accounts", () => {
    // Models switching from a Train2Go-linked profile to one with no linked
    // accounts via two distinct mounts (D4 in design.md): avoids relying on
    // useLiveQuery / useActiveProfile flush ordering on rerender.
    const linkedCoaching = {
      syncSources: [
        {
          id: "train2go",
          linked: true,
          connected: true,
          loading: false,
          error: null,
          sync: vi.fn(),
          connect: vi.fn(),
          label: "Train2Go",
        },
      ],
    } as unknown as Parameters<typeof CalendarHeader>[0]["coaching"];

    const { unmount } = render(
      <CalendarHeader state={baseState} coaching={linkedCoaching} />
    );

    expect(screen.getByTestId("mock-sync-Train2Go")).toBeInTheDocument();

    unmount();

    const unlinkedCoaching = {
      syncSources: [
        {
          id: "train2go",
          linked: false,
          connected: false,
          loading: false,
          error: null,
          sync: vi.fn(),
          connect: vi.fn(),
          label: "Train2Go",
        },
      ],
    } as unknown as Parameters<typeof CalendarHeader>[0]["coaching"];
    render(<CalendarHeader state={baseState} coaching={unlinkedCoaching} />);

    expect(screen.queryByTestId("mock-sync-Train2Go")).not.toBeInTheDocument();
  });

  it("passes batch.pending presence to the cost confirmation's open prop", () => {
    const stateWithPending = {
      ...baseState,
      batch: {
        ...baseState.batch,
        pending: {
          provider: { type: "anthropic" },
          workouts: [],
        },
      },
    } as unknown as Parameters<typeof CalendarHeader>[0]["state"];

    render(
      <CalendarHeader
        state={stateWithPending}
        coaching={
          {
            syncSources: [],
          } as unknown as Parameters<typeof CalendarHeader>[0]["coaching"]
        }
      />
    );

    expect(screen.getByTestId("mock-cost-confirmation").dataset.open).toBe(
      "true"
    );
  });
});
