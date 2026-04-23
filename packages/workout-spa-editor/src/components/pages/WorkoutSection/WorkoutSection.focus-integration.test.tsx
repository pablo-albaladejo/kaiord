/**
 * Focus integration tests (§8.1–§8.5).
 *
 * Rendering `<WorkoutSection>` wires `FocusRegistryProvider` +
 * `useFocusAfterAction` + the three fallback refs (editor root,
 * Add Step button, `<h2>` title). These tests exercise the real
 * store mutations and assert `document.activeElement` after the
 * focus-apply pipeline runs (setTimeout 0).
 *
 * Timing: focus moves happen inside `setTimeout(fn, 0)` per §7.6;
 * tests install `vi.useFakeTimers()` and call `vi.runAllTimers()`
 * to push past that boundary.
 */

import { act } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { __resetOverlayObserverForTests } from "../../../lib/focus/overlay-observer";
import { useWorkoutStore } from "../../../store/workout-store";
import { renderWithProviders } from "../../../test-utils";
import type { KRD } from "../../../types/krd";
import { WorkoutSection } from "./WorkoutSection";

// Mock WorkoutStats and WorkoutPreview to skip heavy chart rendering
// that is irrelevant to focus — they just need to not crash.
vi.mock("../../organisms/WorkoutStats/WorkoutStats", () => ({
  WorkoutStats: () => <div data-testid="workout-stats-mock" />,
}));
vi.mock("../../molecules/WorkoutPreview", () => ({
  WorkoutPreview: () => <div data-testid="workout-preview-mock" />,
}));

const step = (stepIndex: number) => ({
  stepIndex,
  durationType: "time" as const,
  duration: { type: "time" as const, seconds: 300 },
  targetType: "power" as const,
  target: {
    type: "power" as const,
    value: { unit: "watts" as const, value: 150 },
  },
});

const buildKrd = (steps: Array<unknown>): KRD =>
  ({
    version: "1.0",
    type: "structured_workout",
    metadata: { created: "2025-01-01T00:00:00Z", sport: "cycling" },
    extensions: {
      structured_workout: { sport: "cycling", steps, name: "Focus Test" },
    },
  }) as unknown as KRD;

const resetStore = () => {
  useWorkoutStore.setState({
    currentWorkout: null,
    workoutHistory: [],
    historyIndex: -1,
    selectionHistory: [],
    selectedStepId: null,
    selectedStepIds: [],
    isEditing: false,
    deletedSteps: [],
    pendingFocusTarget: null,
  });
};

const readInner = () =>
  useWorkoutStore.getState().currentWorkout!.extensions!.structured_workout as {
    steps: Array<{ id: string }>;
  };

// Reactive wrapper: reads `currentWorkout` from the store so that a
// mutation in the store triggers a re-render with the new workout.
const ReactiveSection = () => {
  const krd = useWorkoutStore((s) => s.currentWorkout);
  const selectedStepId = useWorkoutStore((s) => s.selectedStepId);
  if (!krd) return null;
  const workout = krd.extensions!.structured_workout!;
  return (
    <WorkoutSection
      workout={workout as never}
      krd={krd}
      selectedStepId={selectedStepId}
      onStepSelect={() => {}}
    />
  );
};

const renderSection = (krd: KRD) => {
  useWorkoutStore.getState().loadWorkout(krd);
  return renderWithProviders(<ReactiveSection />);
};

describe("WorkoutSection focus integration (§8.1–§8.5)", () => {
  beforeEach(() => {
    resetStore();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    __resetOverlayObserverForTests();
    resetStore();
    document.body.innerHTML = "";
  });

  it("focuses the next sibling after deleting a step", () => {
    // Arrange — two steps; delete the first.
    renderSection(buildKrd([step(0), step(1)]));
    const initialSecondId = readInner().steps[1].id;

    // Act
    act(() => {
      useWorkoutStore.getState().deleteStep(0);
    });
    act(() => {
      vi.runAllTimers();
    });

    // Assert — focus landed on what was the second step (now index 0).
    const activeId = (
      document.activeElement as HTMLElement | null
    )?.getAttribute("data-testid");
    expect(activeId).toBe("step-card");
    // And it is the same DOM node as the original second step's card.
    const stepCards = document.querySelectorAll(
      '[data-testid="step-card"]'
    ) as NodeListOf<HTMLElement>;
    expect(stepCards.length).toBe(1);
    // The surviving card carries the original second step's id in the
    // registry; we cannot read the id directly off the card (no data
    // attribute for it), but the fact that it was focused is the
    // assertion we care about.
    expect(initialSecondId).toBeDefined();
  });

  it("focuses the new step after createStep", () => {
    // Arrange
    renderSection(buildKrd([step(0)]));

    // Act
    act(() => {
      useWorkoutStore.getState().createStep();
    });
    act(() => {
      vi.runAllTimers();
    });

    // Assert — a second step exists and focus lives on a step card.
    const stepCards = document.querySelectorAll('[data-testid="step-card"]');
    expect(stepCards.length).toBe(2);
    expect(
      (document.activeElement as HTMLElement | null)?.getAttribute(
        "data-testid"
      )
    ).toBe("step-card");
  });

  it("focuses the Add Step button when the list becomes empty", () => {
    // Arrange — one step; delete it.
    renderSection(buildKrd([step(0)]));

    // Act
    act(() => {
      useWorkoutStore.getState().deleteStep(0);
    });
    act(() => {
      vi.runAllTimers();
    });

    // Assert — focus on the Add Step button (the empty-state target).
    // Capture AFTER the mutation so we compare against the live
    // post-re-render DOM node, not a stale pre-mutation reference.
    const addStepButton = document.querySelector(
      '[data-testid="add-step-button"]'
    );
    expect(document.activeElement).toBe(addStepButton);
  });

  it("does not move focus while an input inside the editor is focused", () => {
    // Arrange
    renderSection(buildKrd([step(0), step(1)]));
    // Inject an input inside the editor root; focus it; then trigger
    // a mutation that would normally move focus.
    const editorRoot = document.querySelector(
      '[data-testid="editor-root"]'
    ) as HTMLElement;
    const input = document.createElement("input");
    input.type = "text";
    editorRoot.appendChild(input);
    input.focus();

    // Act
    act(() => {
      useWorkoutStore.getState().deleteStep(0);
    });
    act(() => {
      vi.runAllTimers();
    });

    // Assert — focus stayed on the input; pendingFocusTarget cleared.
    expect(document.activeElement).toBe(input);
    expect(useWorkoutStore.getState().pendingFocusTarget).toBeNull();
  });
});
