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

import type {
  TrainingPeaksPushOptions,
  TrainingPeaksPushOutcome,
} from "../../../hooks/use-trainingpeaks-push";
import type { WorkoutRecord } from "../../../types/calendar-record";
import { TrainingPeaksPushButton } from "./TrainingPeaksPushButton";

const locale = vi.hoisted(() => ({ active: "en" }));

vi.mock("../../../i18n/LocaleProvider", () => ({
  useActiveLocale: () => locale.active,
}));

const push =
  vi.fn<
    (options?: TrainingPeaksPushOptions) => Promise<TrainingPeaksPushOutcome>
  >();

vi.mock("../../../hooks/use-trainingpeaks-push", () => ({
  useTrainingPeaksPush: () => ({ push }),
}));

vi.mock("../../../i18n/use-translate", () => ({
  useTranslate: () => (key: string, params?: Record<string, string>) =>
    params ? `${key} ${Object.values(params).join(" ")}` : key,
}));

const workout = { id: "w1", profileId: "p1" } as WorkoutRecord;

const MOVED: TrainingPeaksPushOutcome = {
  ok: false,
  block: { blocked: true, reason: "moved", recordedDate: "2026-10-20" },
};

const HORIZON_MESSAGE =
  "TrainingPeaks refused the date: planning that far ahead needs a paid account";

describe("TrainingPeaksPushButton", () => {
  beforeEach(() => {
    push.mockReset();
    locale.active = "en";
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

  it.each([
    { active: "en", day: "Tue, Oct 20" },
    { active: "es", day: "mar, 20 oct" },
  ])(
    "should name the recorded day of a blocked moved push in $active",
    async ({ active, day }) => {
      // Arrange
      locale.active = active;
      push.mockResolvedValue(MOVED);
      render(<TrainingPeaksPushButton workout={workout} />);

      // Act
      await userEvent.click(screen.getByTestId("send-to-trainingpeaks-button"));

      // Assert
      expect(
        await screen.findByTestId("trainingpeaks-repush-blocked")
      ).toHaveTextContent(`footer.trainingPeaksRepush.moved ${day}`);
      expect(push).toHaveBeenCalledWith(undefined);
    }
  );

  it("should explain a blocked changed push without a date", async () => {
    // Arrange
    push.mockResolvedValue({
      ok: false,
      block: { blocked: true, reason: "changed" },
    });
    render(<TrainingPeaksPushButton workout={workout} />);

    // Act
    await userEvent.click(screen.getByTestId("send-to-trainingpeaks-button"));

    // Assert
    expect(
      await screen.findByTestId("trainingpeaks-repush-blocked")
    ).toHaveTextContent(/^footer\.trainingPeaksRepush\.changed$/);
  });

  it("should send a copy only after the athlete confirms it", async () => {
    // Arrange
    push.mockResolvedValueOnce(MOVED);
    push.mockResolvedValueOnce({ ok: true, workoutId: "222" });
    render(<TrainingPeaksPushButton workout={workout} />);
    await userEvent.click(screen.getByTestId("send-to-trainingpeaks-button"));
    await userEvent.click(
      await screen.findByTestId("trainingpeaks-send-copy-button")
    );
    expect(
      screen.getByText("footer.trainingPeaksRepush.confirmMessage")
    ).toBeInTheDocument();
    expect(push).toHaveBeenCalledTimes(1);

    // Act
    await userEvent.click(
      screen.getByRole("button", {
        name: "footer.trainingPeaksRepush.confirmSend",
      })
    );

    // Assert
    expect(push).toHaveBeenLastCalledWith({ allowCopy: true });
    expect(
      await screen.findByText("footer.sentToTrainingPeaks")
    ).toBeInTheDocument();
  });

  it("should send nothing when the athlete cancels the copy", async () => {
    // Arrange
    push.mockResolvedValue(MOVED);
    render(<TrainingPeaksPushButton workout={workout} />);
    await userEvent.click(screen.getByTestId("send-to-trainingpeaks-button"));
    await userEvent.click(
      await screen.findByTestId("trainingpeaks-send-copy-button")
    );

    // Act
    await userEvent.click(
      screen.getByRole("button", { name: "footer.trainingPeaksRepush.cancel" })
    );

    // Assert
    expect(push).toHaveBeenCalledTimes(1);
    expect(
      screen.getByTestId("trainingpeaks-repush-blocked")
    ).toBeInTheDocument();
  });
});
