import { faker } from "@faker-js/faker";
import { Factory } from "rosie";
import type { FitWorkoutMessage } from "../../../adapters/fit/shared/types";

export const buildFitWorkoutMessage = new Factory<FitWorkoutMessage>()
  .attr("wktName", () => faker.lorem.words({ max: 5, min: 1 }))
  .attr("sport", () =>
    faker.helpers.arrayElement(["running", "cycling", "swimming", "generic"])
  )
  .attr("numValidSteps", () => faker.number.int({ max: 50, min: 1 }));
