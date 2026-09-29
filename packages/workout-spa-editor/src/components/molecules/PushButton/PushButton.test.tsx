/**
 * The detail page's send control shares the editor's placement notice
 * (tasks 8.2): the ledger-derived `uncertain` and the last run's outcome.
 */
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  failed,
  type PlacementResult,
} from "../../../application/garmin-placement/placement-result";
import { PlacementOutcomeProvider } from "../../../contexts/placement-outcome-context";
import type { WorkoutRecord } from "../../../types/calendar-record";
import type { ExportLedgerEntry } from "../../../types/export-ledger";
import { PushButton } from "./PushButton";

type Deferred = {
  resolve: (result: PlacementResult | undefined) => void;
  promise: Promise<PlacementResult | undefined>;
};
let deferred: Deferred;
const pushMock = vi.fn(() => deferred.promise);
const confirmMock = vi.fn(async () => undefined);

vi.mock("../GarminPushButton/useGarminPush", () => ({
  useGarminPush: () => ({ push: pushMock }),
}));

vi.mock("../GarminPushButton/useGarminPlacementActions", () => ({
  useGarminPlacementActions: () => ({
    confirm: confirmMock,
    dismiss: vi.fn(),
  }),
}));

const DATE = "2026-10-05";
const WORKOUT = { id: "w1", date: DATE } as unknown as WorkoutRecord;
const MOVED = { id: "w1", date: "2026-10-07" } as unknown as WorkoutRecord;
const SENT_CLAIM = /On your Garmin calendar on/;
const UNCERTAIN_ROW = {
  kaiordRecordId: "w1",
  placement: { kind: "uncertain", workoutId: "9", date: DATE },
} as unknown as ExportLedgerEntry;

const makeDeferred = (): Deferred => {
  let resolve: Deferred["resolve"] = () => undefined;
  const promise = new Promise<PlacementResult | undefined>((r) => {
    resolve = r;
  });
  return { resolve, promise };
};

describe("PushButton", () => {
  beforeEach(() => {
    pushMock.mockClear();
    confirmMock.mockClear();
    deferred = makeDeferred();
  });

  it("should render the idle label", () => {
    // Arrange

    // Act
    render(<PushButton workout={WORKOUT} />);

    // Assert
    expect(screen.getByText("Send to Garmin")).toBeInTheDocument();
  });

  it("should transition to pushing then done on a scheduled result", async () => {
    // Arrange
    render(<PushButton workout={WORKOUT} />);

    // Act
    fireEvent.click(screen.getByText("Send to Garmin"));

    // Assert
    expect(await screen.findByText("Sending…")).toBeInTheDocument();
    deferred.resolve({ kind: "scheduled" });
    await waitFor(() => {
      expect(screen.getByText("On your Garmin")).toBeInTheDocument();
    });
    expect(screen.getByRole("status")).toHaveTextContent(
      "On your Garmin calendar on"
    );
  });

  it("should return to idle when the push rejects", async () => {
    // Arrange
    pushMock.mockRejectedValueOnce(new Error("boom"));
    render(<PushButton workout={WORKOUT} />);

    // Act
    fireEvent.click(screen.getByText("Send to Garmin"));

    // Assert
    await waitFor(() => {
      expect(screen.getByText("Send to Garmin")).toBeEnabled();
    });
  });

  it("should stay sendable and explain a failed run", async () => {
    // Arrange
    render(<PushButton workout={WORKOUT} />);

    // Act
    fireEvent.click(screen.getByText("Send to Garmin"));
    deferred.resolve(failed("library-push-failed", true));

    // Assert
    expect(await screen.findByRole("status")).toHaveTextContent(
      "The workout could not be sent to Garmin."
    );
    expect(screen.getByText("Send to Garmin")).toBeEnabled();
  });

  it("should show the ledger's uncertain entry and its answers", async () => {
    // Arrange
    render(<PushButton workout={WORKOUT} placementRow={UNCERTAIN_ROW} />);

    // Act
    fireEvent.click(screen.getByText("It's in Garmin"));

    // Assert
    expect(screen.getByRole("status")).toHaveTextContent(
      "Garmin did not confirm the entry on"
    );
    await waitFor(() => expect(confirmMock).toHaveBeenCalledTimes(1));
  });

  it("should offer a new send when the page reopens after a sent run", async () => {
    // Arrange
    const page = (key: string) => (
      <PlacementOutcomeProvider>
        <PushButton key={key} workout={WORKOUT} />
      </PlacementOutcomeProvider>
    );
    const { rerender } = render(page("first"));
    fireEvent.click(screen.getByText("Send to Garmin"));
    deferred.resolve({ kind: "scheduled" });
    await screen.findByText("On your Garmin");

    // Act
    rerender(page("reopened"));

    // Assert
    expect(screen.getByText("Send to Garmin")).toBeEnabled();
  });

  it("should reopen the send and claim no date after a date change", async () => {
    // Arrange
    const { rerender } = render(<PushButton workout={WORKOUT} />);
    fireEvent.click(screen.getByText("Send to Garmin"));
    deferred.resolve({ kind: "scheduled" });
    await screen.findByText("On your Garmin");

    // Act
    rerender(<PushButton workout={MOVED} />);

    // Assert
    expect(screen.getByText("Send to Garmin")).toBeEnabled();
    expect(screen.queryByText(SENT_CLAIM)).not.toBeInTheDocument();
  });

  it("should claim the sent date again once the workout is back on it", async () => {
    // Arrange
    const { rerender } = render(<PushButton workout={WORKOUT} />);
    fireEvent.click(screen.getByText("Send to Garmin"));
    deferred.resolve({ kind: "scheduled" });
    const claim = (await screen.findByText(SENT_CLAIM)).textContent;
    rerender(<PushButton workout={MOVED} />);

    // Act
    rerender(<PushButton workout={WORKOUT} />);

    // Assert
    expect(screen.getByText(SENT_CLAIM).textContent).toBe(claim);
  });

  it("should not claim a date for a run the reopened page did not see", async () => {
    // Arrange
    const page = (workout: WorkoutRecord) => (
      <PlacementOutcomeProvider>
        <PushButton key={workout.date} workout={workout} />
      </PlacementOutcomeProvider>
    );
    const { rerender } = render(page(WORKOUT));
    fireEvent.click(screen.getByText("Send to Garmin"));
    deferred.resolve({ kind: "scheduled" });
    await screen.findByText("On your Garmin");

    // Act
    rerender(page(MOVED));

    // Assert
    expect(screen.getByText("Send to Garmin")).toBeEnabled();
    expect(screen.queryByText(SENT_CLAIM)).not.toBeInTheDocument();
  });

  it("should keep a dateless warning on a reopened page", async () => {
    // Arrange
    const page = (key: string) => (
      <PlacementOutcomeProvider>
        <PushButton key={key} workout={WORKOUT} />
      </PlacementOutcomeProvider>
    );
    const { rerender } = render(page("first"));
    fireEvent.click(screen.getByText("Send to Garmin"));
    deferred.resolve({ kind: "library-only", reason: "bridge-outdated" });
    const warning = (await screen.findByRole("status")).textContent;

    // Act
    rerender(page("reopened"));

    // Assert
    expect(screen.getByRole("status").textContent).toBe(warning);
  });
});
