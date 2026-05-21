import type { Analytics } from "@kaiord/core";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { AnalyticsProvider } from "../../../contexts";
import { GarminBridgeProvider } from "../../../contexts/garmin-bridge-context";
import { ToastContextProvider } from "../../../contexts/ToastContext";
import { useWorkoutStore } from "../../../store/workout-store";
import type { KRD } from "../../../types/krd";
import { ToastProvider } from "../../atoms/Toast";
import { ImportDropzoneOverlay } from "./ImportDropzoneOverlay";

vi.mock("../../../utils/import-workout", () => ({
  importWorkout: vi.fn(),
  ImportError: class ImportError extends Error {
    format: string | null;
    cause?: unknown;
    constructor(message: string, format: string | null, cause?: unknown) {
      super(message);
      this.name = "ImportError";
      this.format = format;
      this.cause = cause;
    }
  },
}));

const mockKrd: KRD = {
  version: "1.0",
  type: "structured_workout",
  metadata: { created: "2026-01-01T00:00:00Z", sport: "running" },
  extensions: {
    structured_workout: {
      name: "Imported",
      sport: "running",
      steps: [],
    },
  },
};

function renderOverlay(analytics: Analytics) {
  return render(
    <AnalyticsProvider analytics={analytics}>
      <GarminBridgeProvider>
        <ToastProvider>
          <ToastContextProvider>
            <ImportDropzoneOverlay />
          </ToastContextProvider>
        </ToastProvider>
      </GarminBridgeProvider>
    </AnalyticsProvider>
  );
}

describe("ImportDropzoneOverlay", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useWorkoutStore.setState({
      currentWorkout: null,
      undoHistory: [],
      historyIndex: -1,
      selectedStepId: null,
      selectedStepIds: [],
      isEditing: false,
    });
  });

  it("should mount with a file input attached to the DOM", () => {
    // Arrange

    const analytics: Analytics = { pageView: vi.fn(), event: vi.fn() };

    // Act

    renderOverlay(analytics);

    // Assert

    expect(screen.getByTestId("import-dropzone-overlay")).toBeInTheDocument();
    expect(document.querySelector('input[type="file"]')).not.toBeNull();
  });

  it("should auto-click the hidden input on mount so the OS picker opens", () => {
    // Arrange

    const clickSpy = vi.spyOn(HTMLInputElement.prototype, "click");
    const analytics: Analytics = { pageView: vi.fn(), event: vi.fn() };

    // Act

    renderOverlay(analytics);

    // Assert

    expect(clickSpy).toHaveBeenCalled();
  });

  it("should fire workout-imported with the detected format on a successful upload", async () => {
    // Arrange

    const { importWorkout } = await import("../../../utils/import-workout");
    vi.mocked(importWorkout).mockResolvedValue(mockKrd);
    const analytics: Analytics = { pageView: vi.fn(), event: vi.fn() };
    const user = userEvent.setup();
    renderOverlay(analytics);
    const input = document.querySelector(
      'input[type="file"]'
    ) as HTMLInputElement;

    // Act

    await user.upload(
      input,
      new File([JSON.stringify(mockKrd)], "in.krd", {
        type: "application/json",
      })
    );

    // Assert

    await waitFor(() => {
      expect(analytics.event).toHaveBeenCalledWith("workout-imported", {
        format: "krd",
      });
    });
  });
});
