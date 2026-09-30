import { act, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import type { BulkOutcome } from "../../../application/garmin-bulk/send-week-to-garmin";
import { failed } from "../../../application/garmin-placement/placement-result";
import { CALENDAR_WRITE_FEATURE } from "../../../application/garmin-placement/placement-timing";
import { GARMIN_BRIDGE_STORE_URL } from "../../molecules/GarminPushButton/PlacementFeedback";
import { SendWeekPanel, type SendWeekPanelProps } from "./SendWeekPanel";

const T0 = new Date("2026-10-01T08:00:00.000Z");
const WAIT_MS = 30_000;
const OUTDATED = { kind: "library-only", reason: "bridge-outdated" } as const;

const item = (id: string, result?: BulkOutcome["result"]): BulkOutcome => ({
  workoutId: id,
  date: "2026-10-05",
  status: result?.kind ?? "not-eligible",
  ...(result ? { result } : { notEligible: "stale" as const }),
});

const renderPanel = (
  outcomes: BulkOutcome[],
  overrides: Partial<SendWeekPanelProps> = {}
) =>
  render(
    <SendWeekPanel
      state={{ phase: "done", outcomes, total: outcomes.length }}
      weekId="2026-W41"
      features={[CALENDAR_WRITE_FEATURE]}
      onCancel={vi.fn()}
      onRetry={vi.fn()}
      onClose={vi.fn()}
      {...overrides}
    />
  );

afterEach(() => vi.useRealTimers());

describe("SendWeekPanel", () => {
  it("should show one pre-flight message", () => {
    // Arrange
    const state = { phase: "blocked", failure: "no-session" } as const;

    // Act
    renderPanel([], { state });

    // Assert
    expect(screen.getByRole("status")).toHaveTextContent(
      "Sign in to Garmin Connect in this browser, then send the week."
    );
  });

  it("should link each item to its workout page with its status", () => {
    // Arrange
    const outcomes = [item("w-1", { kind: "scheduled" }), item("w-2")];

    // Act
    renderPanel(outcomes);

    // Assert
    const links = screen.getAllByRole("link");
    expect(links[0]).toHaveAttribute(
      "href",
      expect.stringContaining("/workout/w-1")
    );
    expect(screen.getByText("On its date")).toBeInTheDocument();
    expect(
      screen.getByText("Not sent (coach change to resolve first)")
    ).toBeInTheDocument();
  });

  it("should explain an outdated bridge once per run apart from failures", () => {
    // Arrange
    const outcomes = [item("w-1", OUTDATED), item("w-2", OUTDATED)];

    // Act
    renderPanel(outcomes, { features: [] });

    // Assert
    expect(
      screen.getAllByRole("link", { name: "Update the extension" })
    ).toEqual([expect.objectContaining({ href: GARMIN_BRIDGE_STORE_URL })]);
    expect(screen.getByText("Library only: 2")).toBeInTheDocument();
    expect(screen.queryByText(/Needs attention/)).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Retry" })
    ).not.toBeInTheDocument();
  });

  it("should hold Retry with a countdown until the earliest retryAfter", () => {
    // Arrange
    vi.useFakeTimers({ now: T0 });
    const retryAfter = T0.getTime() + WAIT_MS;
    renderPanel([item("w-1", failed("settling", true, { retryAfter }))]);
    const waiting = screen.getByRole("button", { name: "Retry in 30 s" });
    const disabledWhileWaiting = (waiting as HTMLButtonElement).disabled;

    // Act
    act(() => vi.advanceTimersByTime(WAIT_MS));

    // Assert
    expect(disabledWhileWaiting).toBe(true);
    expect(screen.getByRole("button", { name: "Retry" })).toBeEnabled();
  });

  it("should hold Retry while any retryAfter is ahead, even with one ready", () => {
    // Arrange
    vi.useFakeTimers({ now: T0 });
    const retryAfter = T0.getTime() + WAIT_MS;
    const outcomes = [
      item("w-1", failed("needs-reauth", true)),
      item("w-2", failed("settling", true, { retryAfter })),
    ];

    // Act
    renderPanel(outcomes);

    // Assert
    expect(
      screen.getByRole("button", { name: "Retry in 30 s" })
    ).toBeDisabled();
  });

  it("should offer Stop, not Retry or Close, while running", () => {
    // Arrange
    const state = { phase: "running", outcomes: [], total: 3 } as const;

    // Act
    renderPanel([], { state });

    // Assert
    expect(screen.getByRole("button", { name: "Stop" })).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Close" })
    ).not.toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent("0 of 3 handled.");
  });

  it.each([
    { reason: "stopped", label: "Not sent (stopped)" },
    { reason: "no-krd", label: "Not sent (no structured workout)" },
  ] as const)(
    "should explain a $reason item as $label",
    ({ reason, label }) => {
      // Arrange
      const outcome: BulkOutcome = {
        workoutId: "w-1",
        date: "2026-10-05",
        status: "not-eligible",
        notEligible: reason,
      };

      // Act
      renderPanel([outcome]);

      // Assert
      expect(screen.getByText(label, { exact: false })).toBeInTheDocument();
    }
  );

  it.each([
    ["missing-pace-zones", "set your threshold pace in Athlete"],
    ["incomplete-pace-zones", "complete your pace zones in Athlete"],
    ["unsupported-pace-zone-sport", "pace zones only in running or swimming"],
  ] as const)("should tell the athlete how to fix a %s item", (reason, fix) => {
    // Arrange
    const outcome = item("w-1", failed(reason, false));

    // Act
    renderPanel([outcome]);

    // Assert
    expect(screen.getByText(`Failed (${fix})`)).toBeInTheDocument();
  });
});
