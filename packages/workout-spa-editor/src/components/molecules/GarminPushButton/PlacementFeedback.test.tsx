import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import {
  failed,
  type PlacementResult,
} from "../../../application/garmin-placement/placement-result";
import { appI18n, setActiveLocale } from "../../../i18n/i18n";
import type { GarminRemovalEntry } from "../../../types/garmin-removal-entry";
import {
  GARMIN_BRIDGE_STORE_URL,
  PlacementFeedback,
} from "./PlacementFeedback";

const locale = vi.hoisted(() => ({ active: "en" }));

vi.mock("../../../i18n/LocaleProvider", () => ({
  useActiveLocale: () => locale.active,
}));

const DATE = "2026-10-05";
const OLD_DATE = "2026-10-04";

const ENTRY = {
  workoutScheduleId: "5000",
  workoutId: "1707805999",
  date: OLD_DATE,
  attempts: 3,
  abandoned: true,
  state: "retire",
} as GarminRemovalEntry;

const renderFeedback = (
  result: PlacementResult,
  removable: GarminRemovalEntry[] = []
) => {
  const handlers = {
    onConfirm: vi.fn(),
    onSendAnyway: vi.fn(),
    onDismiss: vi.fn(),
  };
  render(
    <PlacementFeedback
      result={result}
      date={DATE}
      removable={removable}
      {...handlers}
    />
  );
  return handlers;
};

describe("PlacementFeedback", () => {
  afterEach(async () => {
    locale.active = "en";
    await appI18n.changeLanguage("en");
  });

  it("should state a scheduled workout plainly with its date", () => {
    // Arrange
    const result: PlacementResult = { kind: "scheduled" };

    // Act
    renderFeedback(result);

    // Assert
    expect(screen.getByRole("status")).toHaveTextContent(
      /On your Garmin calendar on .*5/
    );
    expect(screen.queryByRole("button")).toBeNull();
  });

  it("should offer confirm and send-anyway on a confirmable uncertain result", async () => {
    // Arrange
    const handlers = renderFeedback({
      kind: "uncertain",
      date: DATE,
      canConfirm: true,
    });

    // Act
    await userEvent.click(
      screen.getByRole("button", { name: "It's in Garmin" })
    );
    await userEvent.click(screen.getByRole("button", { name: "Send anyway" }));

    // Assert
    expect(handlers.onConfirm).toHaveBeenCalledTimes(1);
    expect(handlers.onSendAnyway).toHaveBeenCalledTimes(1);
  });

  it("should offer only send-anyway when the entry cannot be confirmed", () => {
    // Arrange
    const result: PlacementResult = {
      kind: "uncertain",
      date: DATE,
      canConfirm: false,
    };

    // Act
    renderFeedback(result);

    // Assert
    expect(screen.queryByRole("button", { name: "It's in Garmin" })).toBeNull();
    expect(screen.getByRole("button", { name: "Send anyway" })).toBeVisible();
  });

  it("should link to the store when the bridge is outdated", () => {
    // Arrange
    const result: PlacementResult = {
      kind: "library-only",
      reason: "bridge-outdated",
    };

    // Act
    renderFeedback(result);

    // Assert
    expect(
      screen.getByRole("link", { name: "Update the extension" })
    ).toHaveAttribute("href", GARMIN_BRIDGE_STORE_URL);
  });

  it("should let the athlete dismiss an entry they removed", async () => {
    // Arrange
    const handlers = renderFeedback({ kind: "scheduled" }, [ENTRY]);

    // Act
    await userEvent.click(screen.getByRole("button", { name: /I removed it/ }));

    // Assert
    expect(handlers.onDismiss).toHaveBeenCalledWith("5000");
  });

  it("should word a failure as an error", () => {
    // Arrange
    const result = failed("needs-reauth", false);

    // Act
    renderFeedback(result);

    // Assert
    expect(
      screen.getByText("Sign in to Garmin Connect again, then retry.")
    ).toHaveClass("text-[var(--danger-text)]");
  });

  it("should speak Spanish when the active locale is es", async () => {
    // Arrange
    await setActiveLocale("es");
    locale.active = "es";

    // Act
    renderFeedback({ kind: "uncertain", date: DATE, canConfirm: false });

    // Assert
    expect(screen.getByRole("status")).toHaveTextContent(
      /Garmin no confirmó la entrada/
    );
  });
});
