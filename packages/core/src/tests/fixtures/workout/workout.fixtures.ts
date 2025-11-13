import { faker } from "@faker-js/faker";
import { Factory } from "rosie";
import type { Workout } from "../../../domain/schemas/workout";
import { buildRepetitionBlock } from "./repetition-block.fixtures";
import { buildWorkoutStep } from "./workout-step.fixtures";

export const buildWorkout = new Factory<Workout>()
  .attr("name", () => faker.lorem.words({ max: 5, min: 1 }))
  .attr("sport", () =>
    faker.helpers.arrayElement(["running", "cycling", "swimming"])
  )
  .attr("subSport", ["sport"], (sport: string) => {
    const subSports: Record<string, Array<string>> = {
      running: ["trail", "road", "track", "treadmill"],
      cycling: ["road", "mountain", "gravel", "indoor_cycling"],
      swimming: ["pool", "open_water"],
    };
    const options = subSports[sport] || ["generic"];
    return faker.helpers.arrayElement(options);
  })
  .attr("steps", () => [
    buildWorkoutStep.build(),
    buildRepetitionBlock.build(),
    buildWorkoutStep.build(),
  ]);
