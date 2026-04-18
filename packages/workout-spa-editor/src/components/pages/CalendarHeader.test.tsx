import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";

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
  CoachingSyncButton: ({ label }: { label: string }) => (
    <button data-testid={`mock-sync-${label}`}>{label}</button>
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

  it("renders a sync button per coaching source", () => {
    const coaching = {
      syncSources: [
        {
          id: "s1",
          connected: true,
          loading: false,
          error: null,
          sync: vi.fn(),
          connect: vi.fn(),
          label: "Garmin",
        },
        {
          id: "s2",
          connected: false,
          loading: false,
          error: null,
          sync: vi.fn(),
          connect: vi.fn(),
          label: "Train2Go",
        },
      ],
    } as unknown as Parameters<typeof CalendarHeader>[0]["coaching"];

    render(<CalendarHeader state={baseState} coaching={coaching} />);

    expect(screen.getByTestId("mock-sync-Garmin")).toBeInTheDocument();
    expect(screen.getByTestId("mock-sync-Train2Go")).toBeInTheDocument();
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
