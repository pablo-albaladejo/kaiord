import { faker } from "@faker-js/faker";
import { Factory } from "rosie";
import type { RepetitionBlock } from "../../../domain/schemas/workout";
import { buildWorkoutStep } from "./workout-step.fixtures";

export const buildRepetitionBlock = new Factory<RepetitionBlock>()
  .attr("repeatCount", () => faker.number.int({ max: 10, min: 2 }))
  .attr("steps", () => [buildWorkoutStep.build(), buildWorkoutStep.build()]);
