/**
 * The coaching dialog's move entry point (design §3.8, AC-12): a matched
 * session offers **Move to another day**, disabled with the reason once it
 * is done; an unconverted plan offers no Move and says to create it first.
 */
import * as Dialog from "@radix-ui/react-dialog";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { coachWorkout } from "../../../application/session-move.test-fixtures";
import type { CoachingActivity } from "../../../types/coaching-activity";
import {
  CoachingActivityDialogContent,
  type CoachingActivityDialogContentProps,
} from "./CoachingActivityDialogContent";
import type { CoachingDialogState } from "./use-coaching-dialog-state";

vi.mock("./use-coaching-day-comments", () => ({
  useCoachingDayComments: () => [],
}));

const garminDrift = vi.fn();

vi.mock("./DialogGarminDrift", () => ({
  DialogGarminDrift: (props: { locked: boolean }) => {
    garminDrift(props);
    return null;
  },
}));

const activity: CoachingActivity = {
  id: "train2go:77",
  source: "train2go",
  sourceBadge: "T2G",
  date: "2026-10-06",
  sport: { label: "Cycling", icon: "🚴" },
  title: "Threshold",
  status: "pending",
  description: "Two blocks.",
};

const renderContent = (
  dialogState: CoachingDialogState,
  { onMoveTo }: { onMoveTo?: (date: string) => void } = { onMoveTo: vi.fn() }
) => {
  const noop = vi.fn();
  const props = {
    activity,
    dialogState,
    descriptionLoad: { reason: null, retry: noop },
    profileId: "p1",
    pickerOpen: false,
    pickerWorkouts: [],
    matching: false,
    splitting: false,
    aiProgress: null,
    aiFailure: null,
    manualCreating: false,
    onClose: noop,
    onAiProcess: noop,
    onAiCancel: noop,
    onEditManually: noop,
    onOpenPicker: noop,
    onClosePicker: noop,
    onSelectWorkout: noop,
    onOpenEditor: noop,
    onOpenExecuted: noop,
    onPushToGarmin: noop,
    onSplit: noop,
    onMoveTo,
  } satisfies CoachingActivityDialogContentProps;
  return render(
    <Dialog.Root open>
      <Dialog.Content aria-describedby={undefined}>
        <CoachingActivityDialogContent {...props} />
      </Dialog.Content>
    </Dialog.Root>
  );
};

const matched = (executed = [] as ReturnType<typeof coachWorkout>[]) =>
  ({
    kind: "matched",
    matchId: "m",
    workout: coachWorkout(),
    executed,
  }) satisfies CoachingDialogState;

const moveButton = () =>
  screen.getByRole("button", { name: "Move to another day" });

describe("CoachingActivityDialogContent move", () => {
  it("should offer Move for a movable matched session", () => {
    // Arrange
    const state = matched();

    // Act
    renderContent(state);

    // Assert
    expect(moveButton()).toBeEnabled();
  });

  it("should disable Move with the reason for a done session", () => {
    // Arrange
    const state = matched([coachWorkout({ id: "rec" })]);

    // Act
    renderContent(state);

    // Assert
    expect(moveButton()).toBeDisabled();
    expect(moveButton()).toHaveAccessibleDescription(
      "Already done — it can't be moved."
    );
  });

  it.each([
    ["its planned side is a recording", { recorded: true }],
    ["its match holds a recording not loaded", { executedWorkoutIds: ["rec"] }],
  ])("should disable Move when %s", (_label, extra) => {
    // Arrange
    const state = { ...matched(), ...extra };

    // Act
    renderContent(state);

    // Assert
    expect(moveButton()).toBeDisabled();
  });

  it("should offer no Move outside a move flow", () => {
    // Arrange
    const state = matched();

    // Act
    renderContent(state, {});

    // Assert
    expect(
      screen.queryByRole("button", { name: "Move to another day" })
    ).toBeNull();
  });

  it("should show the create-first hint and no Move for an unconverted plan", () => {
    // Arrange
    const state: CoachingDialogState = { kind: "no-workout" };

    // Act
    renderContent(state);

    // Assert
    expect(
      screen.getByText("Create the workout first to move it.")
    ).toBeVisible();
    expect(
      screen.queryByRole("button", { name: "Move to another day" })
    ).toBeNull();
  });

  it.each([
    ["a movable session", matched(), false],
    ["a done session", matched([coachWorkout({ id: "rec" })]), true],
    [
      "a session whose plan is a recording",
      { ...matched(), recorded: true },
      true,
    ],
  ])(
    "should hand the Garmin state of %s its lock (AC-29)",
    (_label, state, locked) => {
      // Arrange
      garminDrift.mockClear();

      // Act
      renderContent(state);

      // Assert
      expect(garminDrift).toHaveBeenLastCalledWith(
        expect.objectContaining({ locked })
      );
    }
  );
});
