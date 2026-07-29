/**
 * Regression tests for deleting a step nested inside a repetition block.
 *
 * The trash affordance on a nested step used to be wired to the
 * top-level `deleteStep` store action while `StepList` handed it the
 * step's position *within the block*. The two index domains collided,
 * so deleting the Nth step of a block silently destroyed the top-level
 * step whose `stepIndex` happened to equal N — data loss on a step the
 * user never touched, with the intended step left in place.
 *
 * These tests drive the real store through the real component tree,
 * because the defect lived in the wiring rather than in any single
 * action: a store-only test cannot observe it.
 */

import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it } from "vitest";

import { useWorkoutStore } from "../../../store/workout-store";
import type {
  KRD,
  RepetitionBlock,
  Workout,
  WorkoutStep,
} from "../../../types/krd";
import { isRepetitionBlock, isWorkoutStep } from "../../../types/krd";
import { WorkoutList } from "./WorkoutList";

const TOP_LEVEL_A_SECONDS = 600;
const TOP_LEVEL_B_SECONDS = 300;
const NESTED_FIRST_SECONDS = 100;
const NESTED_SECOND_SECONDS = 200;
const BLOCK_REPEAT_COUNT = 3;
const NESTED_SECOND_POSITION = 1;

const BLOCK_ID = "block-under-test";

const step = (stepIndex: number, seconds: number): WorkoutStep => ({
  stepIndex,
  durationType: "time",
  duration: { type: "time", seconds },
  targetType: "power",
  target: { type: "power", value: { unit: "watts", value: 150 } },
});

const buildKrd = (): KRD => {
  const block: RepetitionBlock = {
    id: BLOCK_ID,
    repeatCount: BLOCK_REPEAT_COUNT,
    steps: [
      step(0, NESTED_FIRST_SECONDS),
      step(NESTED_SECOND_POSITION, NESTED_SECOND_SECONDS),
    ],
  };
  return {
    version: "1.0",
    type: "structured_workout",
    metadata: { created: "2025-01-15T10:30:00Z", sport: "cycling" },
    extensions: {
      structured_workout: {
        name: "Nested delete fixture",
        sport: "cycling",
        steps: [
          step(0, TOP_LEVEL_A_SECONDS),
          step(NESTED_SECOND_POSITION, TOP_LEVEL_B_SECONDS),
          block,
        ],
      },
    },
  } as KRD;
};

const resetStore = () => {
  useWorkoutStore.setState({
    currentWorkout: null,
    undoHistory: [],
    historyIndex: -1,
    selectedStepId: null,
    selectedStepIds: [],
    isEditing: false,
    deletedSteps: [],
    pendingFocusTarget: null,
  });
};

const readWorkout = (): Workout =>
  useWorkoutStore.getState().currentWorkout!.extensions!
    .structured_workout as Workout;

const topLevelDurations = () =>
  readWorkout()
    .steps.filter(isWorkoutStep)
    .map((s) => s.duration.seconds);

const blockDurations = () => {
  const block = readWorkout().steps.find(isRepetitionBlock)!;
  return block.steps.map((s) => (s as WorkoutStep).duration.seconds);
};

/**
 * Mirrors the production wiring in `WorkoutStepsListBinding`: the
 * top-level trash uses `deleteStep`, the nested trash uses the
 * block-aware `deleteStepInRepetitionBlock`.
 */
const Harness = () => {
  const workout = readWorkout();
  const deleteStep = useWorkoutStore((s) => s.deleteStep);
  const deleteStepInBlock = useWorkoutStore(
    (s) => s.deleteStepInRepetitionBlock
  );
  const duplicateStepInBlock = useWorkoutStore(
    (s) => s.duplicateStepInRepetitionBlock
  );
  return (
    <WorkoutList
      workout={workout}
      onStepDelete={deleteStep}
      onDeleteStepInRepetitionBlock={deleteStepInBlock}
      onDuplicateStepInRepetitionBlock={duplicateStepInBlock}
    />
  );
};

const clickNestedDelete = async (position: number) => {
  const user = userEvent.setup();
  const blockCard = screen.getByTestId("repetition-block-card");
  const buttons = within(blockCard).getAllByTestId("delete-step-button");
  await user.click(buttons[position]!);
};

describe("deleting a step nested in a repetition block", () => {
  afterEach(() => {
    resetStore();
  });

  /**
   * The sibling duplicate affordance reads from the same block-local
   * index domain. It was already block-scoped (its handler substitutes
   * the block id before reaching the store), so it never had the delete
   * defect — this pins that difference so the two paths cannot converge.
   */
  it("should duplicate the nested step without touching top-level steps", async () => {
    // Arrange
    useWorkoutStore.getState().loadWorkout(buildKrd());
    render(<Harness />);
    const user = userEvent.setup();
    const blockCard = screen.getByTestId("repetition-block-card");

    // Act
    await user.click(
      within(blockCard).getAllByTestId("duplicate-step-button")[
        NESTED_SECOND_POSITION
      ]!
    );

    // Assert
    expect(blockDurations()).toEqual([
      NESTED_FIRST_SECONDS,
      NESTED_SECOND_SECONDS,
      NESTED_SECOND_SECONDS,
    ]);
    expect(topLevelDurations()).toEqual([
      TOP_LEVEL_A_SECONDS,
      TOP_LEVEL_B_SECONDS,
    ]);
  });

  it("should remove the nested step the user clicked", async () => {
    // Arrange
    useWorkoutStore.getState().loadWorkout(buildKrd());
    render(<Harness />);

    // Act
    await clickNestedDelete(NESTED_SECOND_POSITION);

    // Assert
    expect(blockDurations()).toEqual([NESTED_FIRST_SECONDS]);
  });

  it("should leave every top-level step untouched", async () => {
    // Arrange
    useWorkoutStore.getState().loadWorkout(buildKrd());
    render(<Harness />);

    // Act
    await clickNestedDelete(NESTED_SECOND_POSITION);

    // Assert
    expect(topLevelDurations()).toEqual([
      TOP_LEVEL_A_SECONDS,
      TOP_LEVEL_B_SECONDS,
    ]);
  });

  /**
   * The `deletedSteps` trail is replayed by splicing entries back into
   * the *top-level* step list, so a nested entry would be reinstated in
   * the wrong parent. Nested deletes deliberately leave it alone and
   * rely on the undo-history snapshot instead.
   */
  it("should not append the nested step to the delete-undo trail", async () => {
    // Arrange
    useWorkoutStore.getState().loadWorkout(buildKrd());
    render(<Harness />);

    // Act
    await clickNestedDelete(NESTED_SECOND_POSITION);

    // Assert
    expect(useWorkoutStore.getState().deletedSteps).toEqual([]);
  });

  it("should restore the nested step inside its block on undo", async () => {
    // Arrange
    useWorkoutStore.getState().loadWorkout(buildKrd());
    render(<Harness />);

    // Act
    await clickNestedDelete(NESTED_SECOND_POSITION);
    useWorkoutStore.getState().undo();

    // Assert
    expect(blockDurations()).toEqual([
      NESTED_FIRST_SECONDS,
      NESTED_SECOND_SECONDS,
    ]);
    expect(topLevelDurations()).toEqual([
      TOP_LEVEL_A_SECONDS,
      TOP_LEVEL_B_SECONDS,
    ]);
  });

  /**
   * `spa-editor-focus-management` ("Delete of only step inside
   * repetition block"): emptying a block SHALL remove the parent block
   * in the same state update.
   */
  it("should cascade-delete the block when its last step is removed", async () => {
    // Arrange
    useWorkoutStore.getState().loadWorkout(buildKrd());
    render(<Harness />);

    // Act
    await clickNestedDelete(NESTED_SECOND_POSITION);
    await clickNestedDelete(0);

    // Assert
    expect(readWorkout().steps.filter(isRepetitionBlock)).toHaveLength(0);
    expect(topLevelDurations()).toEqual([
      TOP_LEVEL_A_SECONDS,
      TOP_LEVEL_B_SECONDS,
    ]);
  });
});
