import { faker } from "@faker-js/faker";
import { Factory } from "rosie";
import type { Workout } from "../../../domain/schemas/workout";
import { buildWorkoutStep } from "./workout-step.fixtures";

export const buildSwimmingWorkout = new Factory<Workout>()
  .attr("name", () => faker.lorem.words({ max: 5, min: 1 }))
  .attr("sport", () => "swimming" as const)
  .attr("subSport", () =>
    faker.helpers.arrayElement(["open_water", "lap_swimming"] as const)
  )
  .attr("poolLength", () => faker.helpers.arrayElement([25, 50]))
  .attr("poolLengthUnit", () => "meters" as const)
  .attr("steps", () => [buildWorkoutStep.build(), buildWorkoutStep.build()]);
