import { faker } from "@faker-js/faker";
import { Factory } from "rosie";
import type { WorkoutStep } from "../../../domain/schemas/workout";
import { buildWorkoutStep } from "./workout-step.fixtures";

export const buildWorkoutStepWithEquipment = new Factory<WorkoutStep>()
  .extend(buildWorkoutStep)
  .attr("equipment", () =>
    faker.helpers.arrayElement([
      "swim_fins",
      "swim_kickboard",
      "swim_paddles",
      "swim_pull_buoy",
      "swim_snorkel",
    ] as const)
  );
