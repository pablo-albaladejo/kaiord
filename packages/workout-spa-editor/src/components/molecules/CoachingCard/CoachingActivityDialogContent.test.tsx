import * as Dialog from "@radix-ui/react-dialog";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import {
  structuredKrd,
  THRESHOLD_STEPS,
} from "../../../test-utils/zone-profile-fixtures";
import type { WorkoutRecord } from "../../../types/calendar-record";
import type { CoachingActivity } from "../../../types/coaching-activity";
import {
  CoachingActivityDialogContent,
  type CoachingActivityDialogContentProps,
} from "./CoachingActivityDialogContent";
import type { CoachingDialogState } from "./use-coaching-dialog-state";

vi.mock("./use-coaching-day-comments", () => ({
  useCoachingDayComments: () => [],
}));

const activity: CoachingActivity = {
  id: "train2go:abc",
  source: "train2go",
  sourceBadge: "T2G",
  date: "2026-04-13",
  sport: { label: "Cycling", icon: "🚴" },
  title: "Threshold blocks",
  status: "pending",
  description: "Two 20 min blocks at threshold.",
};

const workout = {
  id: "w1",
  sport: "cycling",
  state: "structured",
  raw: null,
  krd: structuredKrd(THRESHOLD_STEPS),
} as WorkoutRecord;

const renderContent = (
  dialogState: CoachingDialogState,
  shown: CoachingActivity = activity
) => {
  const noop = vi.fn();
  const props = {
    activity: shown,
    dialogState,
    descriptionLoad: { reason: null, retry: noop },
    profileId: "profile-1",
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
  } satisfies CoachingActivityDialogContentProps;
  return render(
    <Dialog.Root open>
      <Dialog.Content aria-describedby={undefined}>
        <CoachingActivityDialogContent {...props} />
      </Dialog.Content>
    </Dialog.Root>
  );
};

describe("CoachingActivityDialogContent", () => {
  it("should place the intensity profile between the header and the coach notes", () => {
    // Arrange
    const state: CoachingDialogState = {
      kind: "matched",
      matchId: "m1",
      workout,
      executed: [],
    };

    // Act
    renderContent(state);

    // Assert
    const meta = screen.getByTestId("coaching-dialog-meta");
    const profile = screen.getByTestId("coaching-dialog-zone-profile");
    const notes = screen.getByTestId("coaching-dialog-notes");
    expect(meta.compareDocumentPosition(profile)).toBe(
      Node.DOCUMENT_POSITION_FOLLOWING
    );
    expect(profile.compareDocumentPosition(notes)).toBe(
      Node.DOCUMENT_POSITION_FOLLOWING
    );
  });

  it("should carry sport, structure duration, status and source in the header row", () => {
    // Arrange
    const state: CoachingDialogState = {
      kind: "matched",
      matchId: "m1",
      workout,
      executed: [],
    };

    // Act
    renderContent(state);

    // Assert
    const meta = screen.getByTestId("coaching-dialog-meta");
    expect(meta).toHaveTextContent("Cycling");
    expect(meta).toHaveTextContent("· 55m");
    expect(meta).toHaveTextContent("Pending");
    expect(meta).toHaveTextContent("T2G");
  });

  it("should estimate the intensity profile from the coach's text when no workout is linked", () => {
    // Arrange
    const state: CoachingDialogState = { kind: "no-workout" };

    // Act
    renderContent(state);

    // Assert
    expect(
      screen.getByTestId("coaching-dialog-zone-estimate-caption")
    ).toHaveTextContent("Estimated from coach text");
  });

  it("should hide the intensity profile when no workout is linked and the text names no zone", () => {
    // Arrange
    const state: CoachingDialogState = { kind: "no-workout" };
    const unzoned = { ...activity, description: "Easy spin with friends" };

    // Act
    renderContent(state, unzoned);

    // Assert
    expect(
      screen.queryByTestId("coaching-dialog-zone-profile")
    ).not.toBeInTheDocument();
  });
});
