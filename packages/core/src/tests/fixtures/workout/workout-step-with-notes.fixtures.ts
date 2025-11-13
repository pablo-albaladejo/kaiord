import { faker } from "@faker-js/faker";
import { Factory } from "rosie";
import type { WorkoutStep } from "../../../domain/schemas/workout";
import { buildWorkoutStep } from "./workout-step.fixtures";

export const buildWorkoutStepWithNotes = new Factory<WorkoutStep>()
  .extend(buildWorkoutStep)
  .attr("notes", () => faker.lorem.sentence({ max: 20, min: 3 }).slice(0, 256));
