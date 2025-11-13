import { faker } from "@faker-js/faker";
import { Factory } from "rosie";
import type { Workout, WorkoutStep } from "../../../domain/schemas/workout";

export const buildAdvancedWorkoutStep = new Factory<WorkoutStep>()
  .attr("stepIndex", () => faker.number.int({ max: 50, min: 0 }))
  .attr("name", () => faker.lorem.words({ max: 3, min: 1 }))
  .attr("durationType", () =>
    faker.helpers.arrayElement([
      "calories",
      "power_less_than",
      "power_greater_than",
      "repeat_until_time",
      "repeat_until_distance",
      "repeat_until_calories",
      "repeat_until_heart_rate_less_than",
      "repeat_until_power_less_than",
      "repeat_until_power_greater_than",
    ] as const)
  )
  .attr("duration", ["durationType"], (durationType: string) => {
    if (durationType === "calories") {
      return {
        type: "calories" as const,
        calories: faker.number.int({ max: 1000, min: 50 }),
      };
    } else if (durationType === "power_less_than") {
      return {
        type: "power_less_than" as const,
        watts: faker.number.int({ max: 500, min: 100 }),
      };
    } else if (durationType === "power_greater_than") {
      return {
        type: "power_greater_than" as const,
        watts: faker.number.int({ max: 500, min: 100 }),
      };
    } else if (durationType === "repeat_until_time") {
      return {
        type: "repeat_until_time" as const,
        seconds: faker.number.int({ max: 3600, min: 60 }),
        repeatFrom: faker.number.int({ max: 10, min: 0 }),
      };
    } else if (durationType === "repeat_until_distance") {
      return {
        type: "repeat_until_distance" as const,
        meters: faker.number.int({ max: 10000, min: 500 }),
        repeatFrom: faker.number.int({ max: 10, min: 0 }),
      };
    } else if (durationType === "repeat_until_calories") {
      return {
        type: "repeat_until_calories" as const,
        calories: faker.number.int({ max: 2000, min: 100 }),
        repeatFrom: faker.number.int({ max: 10, min: 0 }),
      };
    } else if (durationType === "repeat_until_heart_rate_less_than") {
      return {
        type: "repeat_until_heart_rate_less_than" as const,
        bpm: faker.number.int({ max: 200, min: 100 }),
        repeatFrom: faker.number.int({ max: 10, min: 0 }),
      };
    } else if (durationType === "repeat_until_power_less_than") {
      return {
        type: "repeat_until_power_less_than" as const,
        watts: faker.number.int({ max: 500, min: 100 }),
        repeatFrom: faker.number.int({ max: 10, min: 0 }),
      };
    } else {
      return {
        type: "repeat_until_power_greater_than" as const,
        watts: faker.number.int({ max: 500, min: 100 }),
        repeatFrom: faker.number.int({ max: 10, min: 0 }),
      };
    }
  })
  .attr("targetType", () =>
    faker.helpers.arrayElement(["power", "heart_rate", "open"] as const)
  )
  .attr("target", ["targetType"], (targetType: string) => {
    if (targetType === "power") {
      return {
        type: "power" as const,
        value: {
          unit: "watts" as const,
          value: faker.number.int({ max: 400, min: 100 }),
        },
      };
    } else if (targetType === "heart_rate") {
      return {
        type: "heart_rate" as const,
        value: {
          unit: "bpm" as const,
          value: faker.number.int({ max: 200, min: 60 }),
        },
      };
    } else {
      return { type: "open" as const };
    }
  })
  .attr("intensity", () =>
    faker.helpers.arrayElement([
      "warmup",
      "active",
      "cooldown",
      "interval",
    ] as const)
  )
  .attr("notes", () => faker.lorem.sentence({ max: 20, min: 3 }).slice(0, 256));

export const buildAdvancedWorkout = new Factory<Workout>()
  .attr("name", () => faker.lorem.words({ max: 5, min: 1 }))
  .attr("sport", () =>
    faker.helpers.arrayElement(["running", "cycling", "swimming"])
  )
  .attr("subSport", ["sport"], (sport: string) => {
    const subSports: Record<string, Array<string>> = {
      running: ["trail", "road", "track", "treadmill"],
      cycling: ["road", "mountain", "gravel", "indoor_cycling"],
      swimming: ["pool", "open_water", "lap_swimming"],
    };
    const options = subSports[sport] || ["generic"];
    return faker.helpers.arrayElement(options);
  })
  .attr("steps", () => [
    buildAdvancedWorkoutStep.build(),
    buildAdvancedWorkoutStep.build(),
  ]);
