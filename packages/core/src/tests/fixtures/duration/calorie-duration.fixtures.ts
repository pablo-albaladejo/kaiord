import { faker } from "@faker-js/faker";
import { Factory } from "rosie";

type CalorieDuration = { type: "calories"; calories: number };
type RepeatUntilCaloriesDuration = {
  type: "repeat_until_calories";
  calories: number;
  repeatFrom: number;
};

export const buildCalorieDuration = new Factory<CalorieDuration>()
  .attr("type", () => "calories" as const)
  .attr("calories", () => faker.number.int({ max: 1000, min: 50 }));

export const buildRepeatUntilCaloriesDuration =
  new Factory<RepeatUntilCaloriesDuration>()
    .attr("type", () => "repeat_until_calories" as const)
    .attr("calories", () => faker.number.int({ max: 2000, min: 100 }))
    .attr("repeatFrom", () => faker.number.int({ max: 10, min: 0 }));
