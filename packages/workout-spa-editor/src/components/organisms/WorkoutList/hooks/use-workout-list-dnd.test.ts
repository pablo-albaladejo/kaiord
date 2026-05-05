/**
 * useWorkoutListDnd hook tests.
 *
 * Owns the drag-and-drop wiring for `WorkoutList`: sensor configuration,
 * sortable-id derivation (steps use `step-${stepIndex}`, blocks use
 * `block-${arrayIndex}`), drag-start tracking, drag-end reorder
 * dispatch, and drop-cancel paths (over=null, same-position, missing
 * callback).
 *
 * Test fixtures use literal BPM/watt/seconds/meter values for clarity.
 */
/* eslint-disable no-magic-numbers -- test fixtures use literal values for clarity */

import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import type {
  RepetitionBlock,
  Workout,
  WorkoutStep,
} from "../../../../types/krd";
import { useWorkoutListDnd } from "./use-workout-list-dnd";

const makeStep = (stepIndex: number): WorkoutStep => ({
  stepIndex,
  durationType: "time",
  duration: { type: "time", seconds: 300 },
  targetType: "power",
  target: {
    type: "power",
    value: { unit: "watts", value: 200 },
  },
  intensity: "active",
});

const makeBlock = (
  repeatCount: number,
  innerStepIndex = 0
): RepetitionBlock => ({
  repeatCount,
  steps: [
    {
      stepIndex: innerStepIndex,
      durationType: "time",
      duration: { type: "time", seconds: 60 },
      targetType: "power",
      target: {
        type: "power",
        value: { unit: "watts", value: 250 },
      },
      intensity: "active",
    },
  ],
});

const makeWorkout = (steps: Array<WorkoutStep | RepetitionBlock>): Workout => ({
  name: "Test Workout",
  sport: "cycling",
  steps,
});

const makeStepWorkout = (stepCount: number): Workout =>
  makeWorkout(Array.from({ length: stepCount }, (_, i) => makeStep(i)));

describe("useWorkoutListDnd / sortableIds derivation", () => {
  it("should derive `step-<stepIndex>` ids for plain workout steps", () => {
    // Arrange
    const workout = makeStepWorkout(3);

    // Act
    const { result } = renderHook(() => useWorkoutListDnd(workout));

    // Assert
    expect(result.current.sortableIds).toStrictEqual([
      "step-0",
      "step-1",
      "step-2",
    ]);
  });

  it("should derive `block-<position>` ids for repetition blocks", () => {
    // Arrange
    const workout = makeWorkout([makeStep(0), makeBlock(3, 1)]);

    // Act
    const { result } = renderHook(() => useWorkoutListDnd(workout));

    // Assert
    expect(result.current.sortableIds).toStrictEqual(["step-0", "block-1"]);
  });

  it("should derive ids from step content (stepIndex), not array position", () => {
    // Arrange
    const steps: Array<WorkoutStep | RepetitionBlock> = [
      makeStep(99),
      { ...makeStep(42), durationType: "distance" },
      makeBlock(5),
    ];
    const workout = makeWorkout(steps);

    // Act
    const { result } = renderHook(() => useWorkoutListDnd(workout));

    // Assert
    expect(result.current.sortableIds).toStrictEqual([
      "step-99",
      "step-42",
      "block-2",
    ]);
  });

  it("should derive an empty id list for an empty workout", () => {
    // Arrange
    const workout = makeWorkout([]);

    // Act
    const { result } = renderHook(() => useWorkoutListDnd(workout));

    // Assert
    expect(result.current.sortableIds).toStrictEqual([]);
  });

  it("should derive ids that match `generateStepId` per item", () => {
    // Arrange
    const steps: Array<WorkoutStep | RepetitionBlock> = [
      makeStep(0),
      makeBlock(3, 1),
      makeStep(2),
    ];
    const workout = makeWorkout(steps);

    // Act
    const { result } = renderHook(() => useWorkoutListDnd(workout));
    const { sortableIds, generateStepId } = result.current;

    // Assert
    steps.forEach((item, index) => {
      expect(sortableIds[index]).toBe(generateStepId(item, index));
    });
    expect(sortableIds).toStrictEqual(["step-0", "block-1", "step-2"]);
  });

  it("should derive ids in `(step|block)-\\d+` format for every item", () => {
    // Arrange
    const workout = makeWorkout([makeStep(0), makeBlock(3, 1), makeStep(2)]);

    // Act
    const { result } = renderHook(() => useWorkoutListDnd(workout));

    // Assert
    result.current.sortableIds.forEach((id) => {
      expect(typeof id).toBe("string");
      expect(id).toMatch(/^(step|block)-\d+$/);
    });
  });

  it("should derive identical id lists across repeated renders of the same workout", () => {
    // Arrange
    const workout = makeWorkout([makeStep(0), makeStep(1)]);

    // Act
    const a = renderHook(() => useWorkoutListDnd(workout));
    const b = renderHook(() => useWorkoutListDnd(workout));
    const c = renderHook(() => useWorkoutListDnd(workout));

    // Assert
    expect(a.result.current.sortableIds).toStrictEqual(
      b.result.current.sortableIds
    );
    expect(b.result.current.sortableIds).toStrictEqual(
      c.result.current.sortableIds
    );
  });

  it("should derive ids for large workouts (50 steps) without collisions", () => {
    // Arrange
    const workout = makeStepWorkout(50);

    // Act
    const { result } = renderHook(() => useWorkoutListDnd(workout));

    // Assert
    expect(result.current.sortableIds).toHaveLength(50);
    expect(new Set(result.current.sortableIds).size).toBe(50);
  });
});

describe("useWorkoutListDnd / generateStepId", () => {
  it("should return `step-<stepIndex>` for top-level steps", () => {
    // Arrange
    const workout = makeWorkout([]);
    const step = makeStep(7);

    // Act
    const { result } = renderHook(() => useWorkoutListDnd(workout));
    const id = result.current.generateStepId(step, 0);

    // Assert
    expect(id).toBe("step-7");
  });

  it("should return `block-<index>` for repetition blocks regardless of repeatCount", () => {
    // Arrange
    const workout = makeWorkout([]);
    const block: RepetitionBlock = {
      repeatCount: 888,
      steps: [],
    };

    // Act
    const { result } = renderHook(() => useWorkoutListDnd(workout));

    // Assert
    expect(result.current.generateStepId(block, 0)).toBe("block-0");
    expect(result.current.generateStepId(block, 5)).toBe("block-5");
    expect(result.current.generateStepId(block, 99)).toBe("block-99");
  });

  it("should return `block-<parentBlockIndex>-step-<stepIndex>` for nested steps", () => {
    // Arrange
    const workout = makeWorkout([]);
    const step = makeStep(1);

    // Act
    const { result } = renderHook(() => useWorkoutListDnd(workout));
    const idInBlock2 = result.current.generateStepId(step, 0, 2);
    const idInBlock5 = result.current.generateStepId(step, 0, 5);
    const idTopLevel = result.current.generateStepId(step, 0, undefined);

    // Assert
    expect(idInBlock2).toBe("block-2-step-1");
    expect(idInBlock5).toBe("block-5-step-1");
    expect(idTopLevel).toBe("step-1");
    expect(new Set([idInBlock2, idInBlock5, idTopLevel]).size).toBe(3);
  });

  it("should keep step ids stable across non-stepIndex content changes", () => {
    // Arrange
    const step = makeStep(1);
    const workout = makeWorkout([makeStep(0), step]);
    const { result: r1 } = renderHook(() => useWorkoutListDnd(workout));
    const before = r1.current.generateStepId(step, 1);

    // Act
    step.durationType = "distance";
    step.duration = { type: "distance", meters: 5000 };
    step.targetType = "heart_rate";
    step.target = { type: "heart_rate", value: { unit: "bpm", value: 160 } };
    step.intensity = "cooldown";
    const { result: r2 } = renderHook(() => useWorkoutListDnd(workout));
    const after = r2.current.generateStepId(step, 1);

    // Assert
    expect(before).toBe("step-1");
    expect(after).toBe("step-1");
  });

  it("should change step ids when stepIndex itself changes (no reindexing protection)", () => {
    // Arrange
    const step = makeStep(0);
    const workout = makeWorkout([step]);
    const { result: r1 } = renderHook(() => useWorkoutListDnd(workout));
    const before = r1.current.generateStepId(step, 0);

    // Act
    step.stepIndex = 5;
    const { result: r2 } = renderHook(() => useWorkoutListDnd(workout));
    const after = r2.current.generateStepId(step, 0);

    // Assert
    expect(before).toBe("step-0");
    expect(after).toBe("step-5");
  });

  it("should keep block ids stable across repeatCount changes", () => {
    // Arrange
    const block = makeBlock(3);
    const workout = makeWorkout([block]);
    const { result: r1 } = renderHook(() => useWorkoutListDnd(workout));
    const before = r1.current.generateStepId(block, 0);

    // Act
    block.repeatCount = 10;
    const { result: r2 } = renderHook(() => useWorkoutListDnd(workout));
    const after = r2.current.generateStepId(block, 0);

    // Assert
    expect(before).toBe("block-0");
    expect(after).toBe("block-0");
  });

  it("should prefer the item's own `id` over the positional fallback when present", () => {
    // Arrange
    const stepWithId = {
      ...makeStep(7),
      id: "stable-id-xyz",
    } as WorkoutStep;
    const workout = makeWorkout([]);

    // Act
    const { result } = renderHook(() => useWorkoutListDnd(workout));
    const id = result.current.generateStepId(stepWithId, 0);

    // Assert
    expect(id).toBe("stable-id-xyz");
  });

  it("should preserve unique ids across repeated stepIndex values in different parent blocks", () => {
    // Arrange
    const workout = makeWorkout([
      makeStep(1),
      makeBlock(3, 1),
      makeBlock(5, 1),
      makeStep(2),
    ]);

    // Act
    const { result } = renderHook(() => useWorkoutListDnd(workout));
    const main = result.current.sortableIds;
    const block1Steps = (workout.steps[1] as RepetitionBlock).steps.map(
      (s, i) => result.current.generateStepId(s, i, 1)
    );
    const block2Steps = (workout.steps[2] as RepetitionBlock).steps.map(
      (s, i) => result.current.generateStepId(s, i, 2)
    );
    const allIds = [...main, ...block1Steps, ...block2Steps];

    // Assert
    expect(main).toStrictEqual(["step-1", "block-1", "block-2", "step-2"]);
    expect(block1Steps).toStrictEqual(["block-1-step-1"]);
    expect(block2Steps).toStrictEqual(["block-2-step-1"]);
    expect(new Set(allIds).size).toBe(allIds.length);
  });
});

describe("useWorkoutListDnd / drag-start tracking", () => {
  it("should set `activeId` to the dragged item id on drag-start", () => {
    // Arrange
    const workout = makeStepWorkout(3);
    const { result } = renderHook(() => useWorkoutListDnd(workout));

    // Act
    act(() => {
      result.current.handleDragStart({
        active: { id: "step-1", data: { current: undefined } },
        activatorEvent: new MouseEvent("mousedown"),
      });
    });

    // Assert
    expect(result.current.activeId).toBe("step-1");
  });

  it("should expose the corresponding `activeItem` for the dragged id", () => {
    // Arrange
    const step1 = makeStep(1);
    const workout = makeWorkout([makeStep(0), step1, makeStep(2)]);
    const { result } = renderHook(() => useWorkoutListDnd(workout));

    // Act
    act(() => {
      result.current.handleDragStart({
        active: { id: "step-1", data: { current: undefined } },
        activatorEvent: new MouseEvent("mousedown"),
      });
    });

    // Assert
    expect(result.current.activeItem).toBe(step1);
  });

  it("should expose `activeItem === null` when no drag is active", () => {
    // Arrange
    const workout = makeStepWorkout(3);

    // Act
    const { result } = renderHook(() => useWorkoutListDnd(workout));

    // Assert
    expect(result.current.activeId).toBeNull();
    expect(result.current.activeItem).toBeNull();
  });
});

describe("useWorkoutListDnd / drag-end reorder dispatch", () => {
  it("should call `onStepReorder(activeIndex, overIndex)` for a valid drop on a different position", () => {
    // Arrange
    const workout = makeStepWorkout(3);
    const onStepReorder = vi.fn();
    const { result } = renderHook(() =>
      useWorkoutListDnd(workout, onStepReorder)
    );

    // Act
    result.current.handleDragEnd({
      active: { id: "step-0", data: { current: undefined } },
      over: { id: "step-2", data: { current: undefined } },
      delta: { x: 0, y: 0 },
      activatorEvent: new MouseEvent("mousedown"),
      collisions: null,
    });

    // Assert
    expect(onStepReorder).toHaveBeenCalledTimes(1);
    expect(onStepReorder).toHaveBeenCalledWith(0, 2);
  });

  it("should dispatch reorder when dragging a block over a step (mixed item types)", () => {
    // Arrange
    const workout = makeWorkout([makeStep(0), makeBlock(3, 1)]);
    const onStepReorder = vi.fn();
    const { result } = renderHook(() =>
      useWorkoutListDnd(workout, onStepReorder)
    );

    // Act
    result.current.handleDragEnd({
      active: { id: "block-1", data: { current: undefined } },
      over: { id: "step-0", data: { current: undefined } },
      delta: { x: 0, y: -100 },
      activatorEvent: new MouseEvent("mousedown"),
      collisions: null,
    });

    // Assert
    expect(onStepReorder).toHaveBeenCalledWith(1, 0);
  });

  it("should leave the sortable-id list unchanged after a drag-end (parent owns reordering)", () => {
    // Arrange
    const workout = makeWorkout([makeBlock(3, 0), makeStep(1)]);
    const onStepReorder = vi.fn();
    const { result } = renderHook(() =>
      useWorkoutListDnd(workout, onStepReorder)
    );
    const idsBefore = [...result.current.sortableIds];

    // Act
    result.current.handleDragEnd({
      active: { id: "block-0", data: { current: undefined } },
      over: { id: "step-1", data: { current: undefined } },
      delta: { x: 0, y: 100 },
      activatorEvent: new MouseEvent("mousedown"),
      collisions: null,
    });

    // Assert
    expect(onStepReorder).toHaveBeenCalledWith(0, 1);
    expect(result.current.sortableIds).toStrictEqual(idsBefore);
  });

  it("should reflect the new ordering on the next render after parent reorders the workout", () => {
    // Arrange
    const steps = [makeStep(0), makeStep(1), makeStep(2)];
    const before = makeWorkout(steps);
    const { result: r1 } = renderHook(() => useWorkoutListDnd(before));

    // Act
    const after = makeWorkout([steps[1], steps[2], steps[0]]);
    const { result: r2 } = renderHook(() => useWorkoutListDnd(after));

    // Assert
    expect(r1.current.sortableIds).toStrictEqual([
      "step-0",
      "step-1",
      "step-2",
    ]);
    expect(r2.current.sortableIds).toStrictEqual([
      "step-1",
      "step-2",
      "step-0",
    ]);
  });
});

describe("useWorkoutListDnd / drag-end cancel paths", () => {
  it("should NOT call `onStepReorder` when the drop target is the source (same id)", () => {
    // Arrange
    const workout = makeStepWorkout(3);
    const onStepReorder = vi.fn();
    const { result } = renderHook(() =>
      useWorkoutListDnd(workout, onStepReorder)
    );

    // Act
    result.current.handleDragEnd({
      active: { id: "step-1", data: { current: undefined } },
      over: { id: "step-1", data: { current: undefined } },
      delta: { x: 0, y: 0 },
      activatorEvent: new MouseEvent("mousedown"),
      collisions: null,
    });

    // Assert
    expect(onStepReorder).not.toHaveBeenCalled();
  });

  it("should NOT call `onStepReorder` when the drop is cancelled (`over` is null)", () => {
    // Arrange
    const workout = makeStepWorkout(3);
    const onStepReorder = vi.fn();
    const { result } = renderHook(() =>
      useWorkoutListDnd(workout, onStepReorder)
    );

    // Act
    result.current.handleDragEnd({
      active: { id: "step-0", data: { current: undefined } },
      over: null,
      delta: { x: 0, y: 0 },
      activatorEvent: new MouseEvent("mousedown"),
      collisions: null,
    });

    // Assert
    expect(onStepReorder).not.toHaveBeenCalled();
  });

  it("should NOT throw when `onStepReorder` is omitted (read-only consumers)", () => {
    // Arrange
    const workout = makeStepWorkout(3);
    const { result } = renderHook(() => useWorkoutListDnd(workout));

    // Act
    const invoke = () =>
      result.current.handleDragEnd({
        active: { id: "step-0", data: { current: undefined } },
        over: { id: "step-2", data: { current: undefined } },
        delta: { x: 0, y: 0 },
        activatorEvent: new MouseEvent("mousedown"),
        collisions: null,
      });

    // Assert
    expect(invoke).not.toThrow();
  });

  it("should NOT call `onStepReorder` when the active id is not part of `sortableIds`", () => {
    // Arrange
    const workout = makeStepWorkout(3);
    const onStepReorder = vi.fn();
    const { result } = renderHook(() =>
      useWorkoutListDnd(workout, onStepReorder)
    );

    // Act
    result.current.handleDragEnd({
      active: { id: "step-99", data: { current: undefined } },
      over: { id: "step-0", data: { current: undefined } },
      delta: { x: 0, y: 0 },
      activatorEvent: new MouseEvent("mousedown"),
      collisions: null,
    });

    // Assert
    expect(onStepReorder).not.toHaveBeenCalled();
  });

  it("should NOT call `onStepReorder` when the over id is not part of `sortableIds`", () => {
    // Arrange
    const workout = makeStepWorkout(3);
    const onStepReorder = vi.fn();
    const { result } = renderHook(() =>
      useWorkoutListDnd(workout, onStepReorder)
    );

    // Act
    result.current.handleDragEnd({
      active: { id: "step-0", data: { current: undefined } },
      over: { id: "step-99", data: { current: undefined } },
      delta: { x: 0, y: 0 },
      activatorEvent: new MouseEvent("mousedown"),
      collisions: null,
    });

    // Assert
    expect(onStepReorder).not.toHaveBeenCalled();
  });
});

describe("useWorkoutListDnd / sensor + collision wiring", () => {
  it("should expose a non-empty sensors array (pointer + keyboard)", () => {
    // Arrange
    const workout = makeStepWorkout(3);

    // Act
    const { result } = renderHook(() => useWorkoutListDnd(workout));

    // Assert
    expect(Array.isArray(result.current.sensors)).toBe(true);
    expect(result.current.sensors.length).toBeGreaterThan(0);
  });

  it("should expose `closestCenter` as the collision-detection function", () => {
    // Arrange
    const workout = makeStepWorkout(3);

    // Act
    const { result } = renderHook(() => useWorkoutListDnd(workout));

    // Assert
    expect(typeof result.current.collisionDetection).toBe("function");
  });

  it("should expose stable sensor + collision wiring across mixed item types", () => {
    // Arrange
    const workout = makeWorkout([makeStep(0), makeBlock(3, 1), makeStep(2)]);

    // Act
    const { result } = renderHook(() => useWorkoutListDnd(workout));

    // Assert
    expect(result.current.sensors).toBeDefined();
    expect(result.current.collisionDetection).toBeDefined();
  });
});
