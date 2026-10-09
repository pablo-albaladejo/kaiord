import type { Analytics } from "@kaiord/core";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { AnalyticsProvider } from "../../../contexts";
import { renderWithProviders } from "../../../test-utils";
import type { KRD } from "../../../types/krd";
import { importWorkout } from "../../../utils/import-workout";
import { ConvertFlow } from "./ConvertFlow";

vi.mock("../../../utils/import-workout", () => ({
  importWorkout: vi.fn(),
  ImportError: class ImportError extends Error {},
}));

const KRD_FIXTURE = {
  version: "1.0",
  type: "structured_workout",
  metadata: { created: "2026-01-01T00:00:00Z", sport: "cycling" },
  extensions: {
    structured_workout: { name: "W", sport: "cycling", steps: [] },
  },
} as KRD;

const file = (name: string) => new File(["x"], name);

function renderFlow(analytics: Analytics) {
  renderWithProviders(
    <AnalyticsProvider analytics={analytics}>
      <ConvertFlow pair={{ from: "zwo", to: "fit" }} />
    </AnalyticsProvider>
  );
  // The picker's `accept` is only a hint: a user can still pick any file.
  const user = userEvent.setup({ applyAccept: false });
  const upload = (f: File) =>
    user.upload(screen.getByTestId("file-upload-input"), f);
  return { upload };
}

describe("ConvertFlow", () => {
  beforeEach(() => {
    vi.mocked(importWorkout).mockResolvedValue(KRD_FIXTURE);
  });

  it("should refuse a file that is not in the source format", async () => {
    // Arrange
    const analytics = { pageView: vi.fn(), event: vi.fn() };
    const { upload } = renderFlow(analytics);

    // Act
    await upload(file("ride.fit"));

    // Assert
    expect(await screen.findByTestId("convert-wrong-format")).toHaveTextContent(
      "That is not a ZWO (Zwift) file."
    );
    expect(screen.queryByTestId("convert-download")).toBeNull();
    expect(analytics.event).not.toHaveBeenCalled();
  });

  it("should drop the previous workout when the next file fails to load", async () => {
    // Arrange
    const { upload } = renderFlow({ pageView: vi.fn(), event: vi.fn() });
    await upload(file("good.zwo"));
    await screen.findByTestId("convert-download");
    vi.mocked(importWorkout).mockRejectedValueOnce(new Error("corrupt"));

    // Act
    await upload(file("bad.zwo"));

    // Assert
    await vi.waitFor(() =>
      expect(screen.queryByTestId("convert-download")).toBeNull()
    );
  });
});
