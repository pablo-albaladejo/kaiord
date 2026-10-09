import type { Analytics } from "@kaiord/core";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { Router } from "wouter";
import { memoryLocation } from "wouter/memory-location";

import { AnalyticsProvider } from "../../../contexts";
import { useWorkoutStore } from "../../../store/workout-store";
import { renderWithProviders } from "../../../test-utils";
import type { KRD } from "../../../types/krd";
import { exportWorkout } from "../../../utils/export-workout";
import { importWorkout } from "../../../utils/import-workout";
import ConvertPage from "./ConvertPage";

vi.mock("../../../utils/import-workout", () => ({
  importWorkout: vi.fn(),
  ImportError: class ImportError extends Error {},
}));

vi.mock("../../../utils/export-workout", () => ({
  exportWorkout: vi.fn(async () => new Uint8Array([1])),
  downloadWorkout: vi.fn(),
}));

const KRD_FIXTURE: KRD = {
  version: "1.0",
  type: "structured_workout",
  metadata: { created: "2026-01-01T00:00:00Z", sport: "cycling" },
  extensions: {
    structured_workout: { name: "Converted", sport: "cycling", steps: [] },
  },
};

function renderAt(path: string, analytics: Analytics) {
  const { hook, searchHook } = memoryLocation({ path, record: true });
  return renderWithProviders(
    <AnalyticsProvider analytics={analytics}>
      <Router hook={hook} searchHook={searchHook}>
        <ConvertPage />
      </Router>
    </AnalyticsProvider>
  );
}

const fakeAnalytics = (): Analytics => ({ pageView: vi.fn(), event: vi.fn() });

describe("ConvertPage", () => {
  beforeEach(() => {
    vi.mocked(importWorkout).mockResolvedValue(KRD_FIXTURE);
    useWorkoutStore.getState().clearWorkout();
  });

  it("should show the format picker when the params are invalid", () => {
    // Arrange
    const analytics = fakeAnalytics();

    // Act
    renderAt("/convert?from=bogus", analytics);

    // Assert
    expect(screen.getByTestId("convert-format-picker")).toBeInTheDocument();
    expect(screen.queryByTestId("convert-flow")).not.toBeInTheDocument();
  });

  it("should title the page with the preselected pair and state the scope", () => {
    // Arrange
    const analytics = fakeAnalytics();

    // Act
    renderAt("/convert?from=garmin&to=zwo", analytics);

    // Assert
    expect(
      screen.getByRole("heading", {
        name: "Convert Garmin Connect to ZWO (Zwift)",
      })
    ).toBeInTheDocument();
    expect(screen.getByTestId("convert-scope")).toHaveTextContent(
      "not recorded activities"
    );
  });

  it("should convert to the preselected format without touching the editor store", async () => {
    // Arrange
    const analytics = fakeAnalytics();
    const user = userEvent.setup();
    renderAt("/convert?from=fit&to=tcx", analytics);
    const file = new File(["x"], "ride.fit", {
      type: "application/octet-stream",
    });

    // Act
    await user.upload(screen.getByTestId("file-upload-input"), file);
    await user.click(await screen.findByTestId("convert-download"));

    // Assert
    await waitFor(() =>
      expect(analytics.event).toHaveBeenCalledWith("workout-exported", {
        format: "tcx",
      })
    );
    expect(analytics.event).toHaveBeenCalledWith("workout-imported", {
      format: "fit",
    });
    expect(vi.mocked(exportWorkout).mock.calls[0]?.slice(0, 2)).toEqual([
      KRD_FIXTURE,
      "tcx",
    ]);
    expect(useWorkoutStore.getState().currentWorkout).toBeNull();
  });
});
