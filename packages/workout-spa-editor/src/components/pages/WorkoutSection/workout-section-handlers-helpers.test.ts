import { describe, expect, it } from "vitest";
import type { Workout, WorkoutStep } from "../../../types/krd";
import { createUpdatedWorkout } from "./workout-section-handlers-helpers";

/**
 * Tests for workout section handler helpers.
 *
 * Validates that `createUpdatedWorkout` routes an edited step through the
 * stable `ItemId` contract:
 * - Step-id selection updates only that specific step.
 * - Nested-step selection updates only that nested step (not the
 *   homonymous main-list step with the same `stepIndex`).
 * - Invalid / unknown ids leave the workout unchanged.
 */
describe("createUpdatedWorkout", () => {
  const createMockStep = (stepIndex: number, id?: string): WorkoutStep =>
    ({
      ...(id ? { id } : {}),
      stepIndex,
      durationType: "time",
      duration: { type: "time", seconds: 300 },
      targetType: "power",
      target: {
        type: "power",
        value: { unit: "watts", value: 200 },
      },
      intensity: "active",
    }) as WorkoutStep;

  // IDs are stable ItemIds. In production they come from IdProvider;
  // here deterministic strings are enough to express which item the
  // selection points at.
  const MAIN_STEP_0 = "id-main-0";
  const MAIN_STEP_1 = "id-main-1";
  const BLOCK_A = "id-block-a";
  const BLOCK_A_INNER_0 = "id-block-a-inner-0";
  const BLOCK_A_INNER_1 = "id-block-a-inner-1";
  const BLOCK_B = "id-block-b";
  const BLOCK_B_INNER_0 = "id-block-b-inner-0";
  const BLOCK_B_INNER_1 = "id-block-b-inner-1";

  const createMockWorkout = (): Workout =>
    ({
      name: "Test Workout",
      sport: "cycling",
      steps: [
        createMockStep(0, MAIN_STEP_0),
        createMockStep(1, MAIN_STEP_1),
        {
          id: BLOCK_A,
          repeatCount: 3,
          steps: [
            createMockStep(1, BLOCK_A_INNER_0),
            createMockStep(2, BLOCK_A_INNER_1),
          ],
        },
        {
          id: BLOCK_B,
          repeatCount: 2,
          steps: [
            createMockStep(1, BLOCK_B_INNER_0),
            createMockStep(3, BLOCK_B_INNER_1),
          ],
        },
      ],
    }) as Workout;

  describe("updating main workout steps", () => {
    it("updates only the main-list step whose ItemId matches selectedStepId", () => {
      const workout = createMockWorkout();
      const updatedStep: WorkoutStep = {
        ...createMockStep(1),
        duration: { type: "time", seconds: 600 },
      };

      const result = createUpdatedWorkout(workout, updatedStep, MAIN_STEP_1);

      const mainStep = result.steps[1] as WorkoutStep & { id: string };
      expect(mainStep.duration).toEqual({ type: "time", seconds: 600 });
      // Stable id is preserved across the update.
      expect(mainStep.id).toBe(MAIN_STEP_1);

      // Block steps with the same `stepIndex` but a different ItemId are
      // NOT updated.
      const block1 = result.steps[2];
      const block2 = result.steps[3];
      if ("repeatCount" in block1 && "repeatCount" in block2) {
        expect(block1.steps[0].duration).toEqual({
          type: "time",
          seconds: 300,
        });
        expect(block2.steps[0].duration).toEqual({
          type: "time",
          seconds: 300,
        });
      }
    });
  });

  describe("updating block steps", () => {
    it("updates only the nested step in Block A when its ItemId is selected", () => {
      const workout = createMockWorkout();
      const updatedStep: WorkoutStep = {
        ...createMockStep(1),
        duration: { type: "time", seconds: 900 },
      };

      const result = createUpdatedWorkout(
        workout,
        updatedStep,
        BLOCK_A_INNER_0
      );

      expect((result.steps[1] as WorkoutStep).duration).toEqual({
        type: "time",
        seconds: 300,
      });

      const blockA = result.steps[2];
      if ("repeatCount" in blockA) {
        expect(blockA.steps[0].duration).toEqual({
          type: "time",
          seconds: 900,
        });
        // Nested id preserved.
        expect((blockA.steps[0] as WorkoutStep & { id: string }).id).toBe(
          BLOCK_A_INNER_0
        );
      }

      const blockB = result.steps[3];
      if ("repeatCount" in blockB) {
        expect(blockB.steps[0].duration).toEqual({
          type: "time",
          seconds: 300,
        });
      }
    });

    it("updates only the nested step in Block B when its ItemId is selected", () => {
      const workout = createMockWorkout();
      const updatedStep: WorkoutStep = {
        ...createMockStep(1),
        duration: { type: "time", seconds: 1200 },
      };

      const result = createUpdatedWorkout(
        workout,
        updatedStep,
        BLOCK_B_INNER_0
      );

      expect((result.steps[1] as WorkoutStep).duration).toEqual({
        type: "time",
        seconds: 300,
      });

      const blockA = result.steps[2];
      if ("repeatCount" in blockA) {
        expect(blockA.steps[0].duration).toEqual({
          type: "time",
          seconds: 300,
        });
      }

      const blockB = result.steps[3];
      if ("repeatCount" in blockB) {
        expect(blockB.steps[0].duration).toEqual({
          type: "time",
          seconds: 1200,
        });
      }
    });
  });

  describe("edge cases", () => {
    it("returns the workout unchanged when selectedStepId is null", () => {
      const workout = createMockWorkout();
      const updatedStep = createMockStep(1);

      const result = createUpdatedWorkout(workout, updatedStep, null);

      expect(result).toEqual(workout);
    });

    it("returns the workout unchanged when the id does not match any item", () => {
      const workout = createMockWorkout();
      const updatedStep = createMockStep(1);

      const result = createUpdatedWorkout(
        workout,
        updatedStep,
        "id-that-does-not-exist"
      );

      expect(result).toEqual(workout);
    });
  });
});
