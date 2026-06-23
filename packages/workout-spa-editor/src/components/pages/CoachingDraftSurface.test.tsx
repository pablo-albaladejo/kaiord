/**
 * CoachingDraftSurface — renders the Save button for a draft with a
 * structured workout, wires the click to the save action, and shows the
 * no-data state for a rest day. The draft/save hooks and heavy children are
 * mocked so the test focuses on the surface's own branching.
 */
import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { CoachingDraftSurface } from "./CoachingDraftSurface";

type DraftState = { activity: unknown; noStructured: boolean };

let mockDraft: DraftState = { activity: { id: "a-1" }, noStructured: false };
let mockCanSave = true;
const mockSave = vi.fn();

vi.mock("./use-coaching-draft", () => ({
  useCoachingDraft: () => mockDraft,
}));
vi.mock("./use-coaching-draft-save", () => ({
  useCoachingDraftSave: () => ({ canSave: mockCanSave, save: mockSave }),
}));
vi.mock("../../store/selectors/workout-selectors", () => ({
  useCurrentWorkout: () => null,
}));
vi.mock("../../store/workout-store", () => ({
  useWorkoutStore: () => undefined,
}));
vi.mock("../../hooks/use-app-handlers", () => ({
  useAppHandlers: () => ({ handleStepSelect: vi.fn() }),
}));
vi.mock("./EditorPageHeader", () => ({
  EditorPageHeader: () => <div data-testid="editor-header" />,
}));
vi.mock("./EditorLoadingState", () => ({
  EditorNoData: () => <div data-testid="editor-no-data" />,
}));
vi.mock("./WorkoutSection/WorkoutSection", () => ({
  WorkoutSection: () => <div data-testid="workout-section" />,
}));
vi.mock("../organisms/CoachingSidebar/CoachingSidebar", () => ({
  CoachingSidebar: () => <div data-testid="coaching-sidebar" />,
}));

const SAVE_BUTTON = "coaching-draft-save-button";

afterEach(() => {
  vi.clearAllMocks();
  mockDraft = { activity: { id: "a-1" }, noStructured: false };
  mockCanSave = true;
});

describe("CoachingDraftSurface", () => {
  it("should render the Save button for a draft with a structured workout", () => {
    // Arrange
    mockDraft = { activity: { id: "a-1" }, noStructured: false };

    // Act
    render(<CoachingDraftSurface coachingDraftId="a-1" />);

    // Assert
    expect(screen.getByTestId(SAVE_BUTTON)).toBeInTheDocument();
    expect(screen.queryByTestId("editor-no-data")).toBeNull();
  });

  it("should call save when the Save button is clicked", () => {
    // Arrange
    mockDraft = { activity: { id: "a-1" }, noStructured: false };
    render(<CoachingDraftSurface coachingDraftId="a-1" />);

    // Act
    fireEvent.click(screen.getByTestId(SAVE_BUTTON));

    // Assert
    expect(mockSave).toHaveBeenCalledTimes(1);
  });

  it("should show the no-data state for a rest day", () => {
    // Arrange
    mockDraft = { activity: undefined, noStructured: true };

    // Act
    render(<CoachingDraftSurface coachingDraftId="a-1" />);

    // Assert
    expect(screen.getByTestId("editor-no-data")).toBeInTheDocument();
    expect(screen.queryByTestId(SAVE_BUTTON)).toBeNull();
  });
});
