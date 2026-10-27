import { beforeEach, describe, expect, it, vi } from "vitest";

import { useWorkoutStore } from "../../../store/workout-store";
import { render, screen, userEvent } from "../../../test-utils";
import type { KRD } from "../../../types/krd";
import { StaleSchemaGate } from "./StaleSchemaGate";

const stale = vi.hoisted(() => ({ value: false }));
vi.mock("../../../hooks/use-stale-schema", () => ({
  useStaleSchema: () => stale.value,
}));
const downloadBackup = vi.hoisted(() => vi.fn());
vi.mock("../../../utils/backup-download", () => ({ downloadBackup }));

const draft: KRD = {
  version: "1.0",
  type: "structured_workout",
  metadata: { created: "2026-10-27T08:00:00Z", sport: "cycling" },
  extensions: {
    structured_workout: { name: "Draft", sport: "cycling", steps: [] },
  },
};

describe("StaleSchemaGate", () => {
  beforeEach(() => {
    stale.value = false;
    downloadBackup.mockClear();
    useWorkoutStore.setState({ currentWorkout: null });
  });

  it("should render nothing while this tab's schema is current", () => {
    // Arrange
    useWorkoutStore.setState({ currentWorkout: draft });

    // Act
    render(<StaleSchemaGate />);

    // Assert
    expect(screen.queryByTestId("stale-schema-dialog")).not.toBeInTheDocument();
  });

  it("should offer the in-memory draft as a file once stale", async () => {
    // Arrange
    const user = userEvent.setup();
    stale.value = true;
    useWorkoutStore.setState({ currentWorkout: draft });
    render(<StaleSchemaGate />);

    // Act
    await user.click(
      await screen.findByRole("button", { name: "Download draft" })
    );

    // Assert
    expect(downloadBackup).toHaveBeenCalledWith(draft);
  });

  it("should block without a draft action when nothing is loaded", async () => {
    // Arrange
    stale.value = true;

    // Act
    render(<StaleSchemaGate />);

    // Assert
    expect(
      await screen.findByTestId("stale-schema-dialog")
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Download draft" })
    ).not.toBeInTheDocument();
  });
});
