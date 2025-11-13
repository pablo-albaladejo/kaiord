import { faker } from "@faker-js/faker";
import { Factory } from "rosie";
import type { Workout } from "../../../domain/schemas/workout";
import { buildWorkout } from "./workout.fixtures";

export const buildWorkoutWithSubSport = new Factory<Workout>()
  .extend(buildWorkout)
  .attr("subSport", ["sport"], (sport: string) => {
    const subSports: Record<string, Array<string>> = {
      running: ["trail", "road", "track", "treadmill"],
      cycling: ["road", "mountain", "gravel", "indoor_cycling"],
      swimming: ["pool", "open_water", "lap_swimming"],
    };
    const options = subSports[sport] || ["generic"];
    return faker.helpers.arrayElement(options);
  });
