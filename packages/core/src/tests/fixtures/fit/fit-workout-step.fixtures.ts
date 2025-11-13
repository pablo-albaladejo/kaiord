import { faker } from "@faker-js/faker";
import { Factory } from "rosie";
import type { FitWorkoutStep } from "../../../adapters/fit/types";

export const buildFitWorkoutStep = new Factory<FitWorkoutStep>()
  .attr("messageIndex", () => faker.number.int({ max: 50, min: 0 }))
  .attr("durationType", () =>
    faker.helpers.arrayElement(["time", "distance", "open"])
  )
  .attr("targetType", () =>
    faker.helpers.arrayElement(["power", "heartRate", "cadence", "open"])
  );
