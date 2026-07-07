import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { activityToWorkoutRecord } from "../../../application/coaching/activity-to-workout-record";
import { buildSourceActivityRecord } from "../../../types/activity-record";
import { ExecutedActivityDialog } from "./ExecutedActivityDialog";

const activityWorkout = () =>
  activityToWorkoutRecord(
    buildSourceActivityRecord({
      profileId: "p1",
      date: "2026-04-06",
      sport: "running",
      sourceBridgeId: "garmin-bridge",
      externalId: "ext-1",
      durationSeconds: 1800,
      distanceMeters: 5000,
    })
  );

describe("ExecutedActivityDialog", () => {
  it("should not render content when workout is null", () => {
    // Arrange

    // Act
    render(<ExecutedActivityDialog workout={null} onClose={vi.fn()} />);

    // Assert
    expect(
      screen.queryByTestId("executed-activity-dialog")
    ).not.toBeInTheDocument();
  });

  it("should render the recorded activity's real content", () => {
    // Arrange
    const workout = activityWorkout();

    // Act
    render(<ExecutedActivityDialog workout={workout} onClose={vi.fn()} />);

    // Assert
    expect(screen.getByTestId("executed-activity-dialog")).toBeInTheDocument();
    expect(screen.getByText("running")).toBeInTheDocument();
    expect(screen.getByText(/2026-04-06/)).toBeInTheDocument();
    expect(screen.getByTestId("executed-activity-duration")).toHaveTextContent(
      "30:00"
    );
    expect(screen.getByTestId("executed-activity-distance")).toHaveTextContent(
      "5.00 km"
    );
  });

  it("should call onClose when dismissed", async () => {
    // Arrange
    const onClose = vi.fn();
    const user = userEvent.setup();
    render(
      <ExecutedActivityDialog workout={activityWorkout()} onClose={onClose} />
    );

    // Act
    await user.click(screen.getByLabelText("Close"));

    // Assert
    expect(onClose).toHaveBeenCalled();
  });
});
