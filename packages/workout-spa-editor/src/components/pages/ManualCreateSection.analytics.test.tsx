/**
 * Analytics integration tests for ManualCreateSection.
 *
 * Verifies that `workout-imported` is fired with the correct format on
 * a successful import and that it is NOT fired when the import fails.
 */
import type { Analytics } from "@kaiord/core";
import { render, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { AnalyticsProvider } from "../../contexts";
import type { KRD } from "../../types/krd";
import { ManualCreateSection } from "./ManualCreateSection";

vi.mock("../../utils/import-workout", () => ({
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

const mockKRD: KRD = {
  version: "1.0",
  type: "structured_workout",
  metadata: { created: "2025-01-15T10:30:00Z", sport: "running" },
  extensions: {
    structured_workout: {
      name: "Imported",
      sport: "running",
      steps: [],
    },
  },
};

function renderSection(analytics: Analytics) {
  return render(
    <AnalyticsProvider analytics={analytics}>
      <ManualCreateSection
        onCreateClick={vi.fn()}
        onFileLoad={vi.fn()}
        onFileError={vi.fn()}
      />
    </AnalyticsProvider>
  );
}

describe("ManualCreateSection analytics", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(async () => {
    await new Promise((resolve) => setTimeout(resolve, 50));
    vi.clearAllTimers();
  });

  it("fires workout-imported with detected format on successful import", async () => {
    // Arrange
    const { importWorkout } = await import("../../utils/import-workout");
    vi.mocked(importWorkout).mockResolvedValue(mockKRD);

    const analytics: Analytics = {
      pageView: vi.fn(),
      event: vi.fn(),
    };
    const user = userEvent.setup();

    const { getByText, getByLabelText } = renderSection(analytics);

    // Act — expand the section
    await user.click(getByText(/or create manually/i));

    const fileInput = getByLabelText(/upload workout file/i);
    const file = new File([JSON.stringify(mockKRD)], "test.tcx", {
      type: "application/xml",
    });

    await user.upload(fileInput, file);

    // Assert
    await waitFor(() => {
      expect(analytics.event).toHaveBeenCalledWith("workout-imported", {
        format: "tcx",
      });
    });
  });

  it("fires workout-imported with format=fit on successful FIT import", async () => {
    // Arrange
    const { importWorkout } = await import("../../utils/import-workout");
    vi.mocked(importWorkout).mockResolvedValue(mockKRD);

    const analytics: Analytics = {
      pageView: vi.fn(),
      event: vi.fn(),
    };
    const user = userEvent.setup();

    const { getByText, getByLabelText } = renderSection(analytics);

    // Act — expand the section
    await user.click(getByText(/or create manually/i));

    const fileInput = getByLabelText(/upload workout file/i);
    const file = new File([new Uint8Array([14, 16])], "workout.fit", {
      type: "application/octet-stream",
    });

    await user.upload(fileInput, file);

    // Assert
    await waitFor(() => {
      expect(analytics.event).toHaveBeenCalledWith("workout-imported", {
        format: "fit",
      });
    });
  });

  it("does NOT fire workout-imported when the import fails", async () => {
    // Arrange
    const { importWorkout, ImportError } =
      await import("../../utils/import-workout");
    vi.mocked(importWorkout).mockRejectedValue(
      new ImportError("Failed to parse file", "krd")
    );

    const analytics: Analytics = {
      pageView: vi.fn(),
      event: vi.fn(),
    };
    const user = userEvent.setup();

    const { getByText, getByLabelText } = renderSection(analytics);

    // Act
    await user.click(getByText(/or create manually/i));

    const fileInput = getByLabelText(/upload workout file/i);
    const file = new File(["invalid"], "broken.krd", {
      type: "application/json",
    });

    await user.upload(fileInput, file);

    // Assert — wait until the import has actually run, then verify no
    // workout-imported event was emitted.
    await waitFor(() => {
      expect(importWorkout).toHaveBeenCalled();
    });

    expect(analytics.event).not.toHaveBeenCalledWith(
      "workout-imported",
      expect.anything()
    );
  });
});
