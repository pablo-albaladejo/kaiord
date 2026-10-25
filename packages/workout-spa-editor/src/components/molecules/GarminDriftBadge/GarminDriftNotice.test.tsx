/**
 * The detail and dialog state of a Garmin entry left on another day, and
 * its Update Garmin action (design §3.11, AC-19, AC-20, AC-29).
 */
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  failed,
  type PlacementResult,
} from "../../../application/garmin-placement/placement-result";
import { CALENDAR_WRITE_FEATURE } from "../../../application/garmin-placement/placement-timing";
import { PlacementOutcomeProvider } from "../../../contexts/placement-outcome-context";
import type { WorkoutRecord } from "../../../types/calendar-record";
import type { ExportLedgerEntry } from "../../../types/export-ledger";
import { GarminDriftNotice } from "./GarminDriftNotice";

const pushMock = vi.fn(async (): Promise<PlacementResult> => ({
  kind: "moved",
}));
const bridge = {
  extensionInstalled: true,
  sessionActive: true,
  features: [CALENDAR_WRITE_FEATURE],
};

vi.mock("../../../contexts", async (importOriginal) => ({
  ...(await importOriginal<Record<string, unknown>>()),
  useGarminBridge: () => bridge,
}));

vi.mock("../GarminPushButton/useGarminPush", () => ({
  useGarminPush: () => ({ push: pushMock }),
}));

vi.mock("../GarminPushButton/useGarminPlacementActions", () => ({
  useGarminPlacementActions: () => ({ confirm: vi.fn(), dismiss: vi.fn() }),
}));

const WORKOUT = { id: "w1", date: "2026-10-08" } as unknown as WorkoutRecord;

const rowOn = (date: string, kind: "scheduled" | "unconfirmed" = "scheduled") =>
  ({
    kaiordRecordId: "w1",
    placement: { kind, workoutScheduleId: "202", workoutId: "9", date },
  }) as unknown as ExportLedgerEntry;

const renderNotice = (
  row: ExportLedgerEntry | undefined,
  { locked = false, withFeedback = false } = {}
) =>
  render(
    <PlacementOutcomeProvider>
      <GarminDriftNotice
        workout={WORKOUT}
        placementRow={row}
        locked={locked}
        withFeedback={withFeedback}
      />
    </PlacementOutcomeProvider>
  );

const updateButton = () =>
  screen.getByRole("button", { name: "Update Garmin" });

describe("GarminDriftNotice", () => {
  beforeEach(() => {
    pushMock.mockClear();
    Object.assign(bridge, {
      extensionInstalled: true,
      sessionActive: true,
      features: [CALENDAR_WRITE_FEATURE],
    });
  });

  it("should say Garmin still holds the old day and update it on demand", async () => {
    // Arrange
    renderNotice(rowOn("2026-10-06"));

    // Act
    fireEvent.click(updateButton());

    // Assert
    expect(screen.getByText("Garmin still on Tue, Oct 6")).toBeInTheDocument();
    await waitFor(() => expect(pushMock).toHaveBeenCalledTimes(1));
  });

  it("should hedge an unconfirmed placement", () => {
    // Arrange
    const row = rowOn("2026-10-06", "unconfirmed");

    // Act
    renderNotice(row);

    // Assert
    expect(
      screen.getByText("Garmin may still be on Tue, Oct 6")
    ).toBeInTheDocument();
    expect(updateButton()).toBeEnabled();
  });

  it.each([
    [
      "the bridge is not detected",
      { extensionInstalled: false },
      "Install the Kaiord extension for Garmin to send this workout.",
    ],
    [
      "Garmin is signed out",
      { sessionActive: false },
      "Sign in to Garmin Connect in this browser to send this workout.",
    ],
    [
      "the bridge cannot write the calendar",
      { features: [] },
      "Update the Kaiord extension for Garmin to move this workout on the Garmin calendar.",
    ],
  ])(
    "should keep the state but disable Update Garmin while %s",
    (_label, state, why) => {
      // Arrange
      Object.assign(bridge, state);

      // Act
      renderNotice(rowOn("2026-10-06"));

      // Assert
      expect(screen.getByText("Garmin still on Tue, Oct 6")).toBeVisible();
      expect(updateButton()).toBeDisabled();
      expect(updateButton()).toHaveAccessibleDescription(why);
    }
  );

  it.each([
    ["a locked session", rowOn("2026-10-06"), true],
    ["a placement on the workout's day", rowOn("2026-10-08"), false],
    ["a workout never sent", undefined, false],
  ])("should show nothing for %s", (_label, row, locked) => {
    // Arrange
    const options = { locked };

    // Act
    renderNotice(row, options);

    // Assert
    expect(screen.queryByTestId("garmin-drift-notice")).toBeNull();
  });

  it("should clear once the ledger shows Garmin on the workout's day", () => {
    // Arrange
    const view = renderNotice(rowOn("2026-10-06"));

    // Act
    view.rerender(
      <PlacementOutcomeProvider>
        <GarminDriftNotice
          workout={WORKOUT}
          placementRow={rowOn("2026-10-08")}
          locked={false}
        />
      </PlacementOutcomeProvider>
    );

    // Assert
    expect(screen.queryByText(/Garmin still on/)).toBeNull();
  });

  it("should show a failed update beside the state it left", async () => {
    // Arrange
    pushMock.mockResolvedValueOnce(failed("needs-reauth", false));
    renderNotice(rowOn("2026-10-06"), { withFeedback: true });

    // Act
    fireEvent.click(updateButton());

    // Assert
    expect(
      await screen.findByText("Sign in to Garmin Connect again, then retry.")
    ).toBeInTheDocument();
    expect(screen.getByText("Garmin still on Tue, Oct 6")).toBeInTheDocument();
  });

  it("should keep a successful update's outcome once the state clears", async () => {
    // Arrange
    const view = renderNotice(rowOn("2026-10-06"), { withFeedback: true });
    fireEvent.click(updateButton());
    await waitFor(() => expect(pushMock).toHaveBeenCalledTimes(1));

    // Act
    view.rerender(
      <PlacementOutcomeProvider>
        <GarminDriftNotice
          workout={WORKOUT}
          placementRow={rowOn("2026-10-08")}
          locked={false}
          withFeedback
        />
      </PlacementOutcomeProvider>
    );

    // Assert
    expect(
      await screen.findByText(
        "Moved on your Garmin calendar to Thursday, October 8"
      )
    ).toBeInTheDocument();
    expect(screen.queryByText(/Garmin still on/)).toBeNull();
  });
});
