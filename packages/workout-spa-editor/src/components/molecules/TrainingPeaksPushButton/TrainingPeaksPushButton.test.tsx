/**
 * The TrainingPeaks send control on its own. Whether the destination is
 * reachable is `useTrainingPeaksGate`'s question and has its own suite.
 *
 * The case that earns this file is the failure one: TrainingPeaks refuses any
 * date past the account's planning horizon, and unlike the Garmin control this
 * button must SAY so rather than fall silently back to idle.
 */

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { WorkoutRecord } from "../../../types/calendar-record";
import { TrainingPeaksPushButton } from "./TrainingPeaksPushButton";

type Outcome =
  { ok: true; workoutId: string | undefined } | { ok: false; message: string };

const push = vi.fn<() => Promise<Outcome>>();

vi.mock("../../../hooks/use-trainingpeaks-push", () => ({
  useTrainingPeaksPush: () => ({ push }),
}));

vi.mock("../../../i18n/use-translate", () => ({
  useTranslate: () => (key: string) => key,
}));

const workout = { id: "w1", profileId: "p1" } as WorkoutRecord;

const HORIZON_MESSAGE =
  "TrainingPeaks refused the date: planning that far ahead needs a paid account";

describe("TrainingPeaksPushButton", () => {
  beforeEach(() => {
    push.mockReset();
  });

  it("should offer the send action before anything is pushed", () => {
    // Arrange
    push.mockResolvedValue({ ok: true, workoutId: "1" });

    // Act
    render(<TrainingPeaksPushButton workout={workout} />);

    // Assert
    expect(
      screen.getByTestId("send-to-trainingpeaks-button")
    ).toHaveTextContent("footer.sendToTrainingPeaks");
  });

  it("should report the sent state after a successful push", async () => {
    // Arrange
    push.mockResolvedValue({ ok: true, workoutId: "4242" });
    render(<TrainingPeaksPushButton workout={workout} />);

    // Act
    await userEvent.click(screen.getByTestId("send-to-trainingpeaks-button"));

    // Assert
    expect(
      await screen.findByText("footer.sentToTrainingPeaks")
    ).toBeInTheDocument();
  });

  it("should surface the planning-horizon refusal instead of going quiet", async () => {
    // Arrange
    push.mockResolvedValue({ ok: false, message: HORIZON_MESSAGE });
    render(<TrainingPeaksPushButton workout={workout} />);

    // Act
    await userEvent.click(screen.getByTestId("send-to-trainingpeaks-button"));

    // Assert
    expect(
      await screen.findByTestId("trainingpeaks-push-error")
    ).toHaveTextContent(HORIZON_MESSAGE);
    expect(screen.getByTestId("send-to-trainingpeaks-button")).toBeEnabled();
  });

  it("should notify the caller only when the push succeeded", async () => {
    // Arrange
    const onSent = vi.fn();
    push.mockResolvedValue({ ok: false, message: HORIZON_MESSAGE });
    render(<TrainingPeaksPushButton workout={workout} onSent={onSent} />);

    // Act
    await userEvent.click(screen.getByTestId("send-to-trainingpeaks-button"));

    // Assert
    await screen.findByTestId("trainingpeaks-push-error");
    expect(onSent).not.toHaveBeenCalled();
  });
});
