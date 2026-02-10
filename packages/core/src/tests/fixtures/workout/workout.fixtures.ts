import { faker } from "@faker-js/faker";
import { Factory } from "rosie";
import type { Sport } from "../../../domain/schemas/sport";
import type { SubSport } from "../../../domain/schemas/sub-sport";
import type { Workout } from "../../../domain/schemas/workout";
import { buildRepetitionBlock } from "./repetition-block.fixtures";
import { buildWorkoutStep } from "./workout-step.fixtures";

const SUB_SPORTS: Record<Sport, SubSport[]> = {
  running: ["trail", "street", "track", "treadmill"],
  cycling: ["road", "mountain", "gravel_cycling", "indoor_cycling"],
  swimming: ["lap_swimming", "open_water"],
  generic: ["generic"],
};

export const buildWorkout = new Factory<Workout>()
  .attr("name", () => faker.lorem.words({ max: 5, min: 1 }))
  .attr("sport", () =>
    faker.helpers.arrayElement(["running", "cycling", "swimming"] as const),
  )
  .attr("subSport", ["sport"], (sport: Sport) =>
    faker.helpers.arrayElement(SUB_SPORTS[sport]),
  )
  .attr("steps", () => [
    buildWorkoutStep.build(),
    buildRepetitionBlock.build(),
    buildWorkoutStep.build(),
  ]);
