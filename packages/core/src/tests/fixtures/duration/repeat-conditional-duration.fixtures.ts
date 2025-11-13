import { faker } from "@faker-js/faker";
import { Factory } from "rosie";

type RepeatUntilTimeDuration = {
  type: "repeat_until_time";
  seconds: number;
  repeatFrom: number;
};
type RepeatUntilDistanceDuration = {
  type: "repeat_until_distance";
  meters: number;
  repeatFrom: number;
};
type RepeatUntilHeartRateLessThanDuration = {
  type: "repeat_until_heart_rate_less_than";
  bpm: number;
  repeatFrom: number;
};
type RepeatUntilHeartRateGreaterThanDuration = {
  type: "repeat_until_heart_rate_greater_than";
  bpm: number;
  repeatFrom: number;
};

export const buildRepeatUntilTimeDuration =
  new Factory<RepeatUntilTimeDuration>()
    .attr("type", () => "repeat_until_time" as const)
    .attr("seconds", () => faker.number.int({ max: 3600, min: 60 }))
    .attr("repeatFrom", () => faker.number.int({ max: 10, min: 0 }));

export const buildRepeatUntilDistanceDuration =
  new Factory<RepeatUntilDistanceDuration>()
    .attr("type", () => "repeat_until_distance" as const)
    .attr("meters", () => faker.number.int({ max: 10000, min: 500 }))
    .attr("repeatFrom", () => faker.number.int({ max: 10, min: 0 }));

export const buildRepeatUntilHeartRateLessThanDuration =
  new Factory<RepeatUntilHeartRateLessThanDuration>()
    .attr("type", () => "repeat_until_heart_rate_less_than" as const)
    .attr("bpm", () => faker.number.int({ max: 200, min: 100 }))
    .attr("repeatFrom", () => faker.number.int({ max: 10, min: 0 }));

export const buildRepeatUntilHeartRateGreaterThanDuration =
  new Factory<RepeatUntilHeartRateGreaterThanDuration>()
    .attr("type", () => "repeat_until_heart_rate_greater_than" as const)
    .attr("bpm", () => faker.number.int({ max: 200, min: 100 }))
    .attr("repeatFrom", () => faker.number.int({ max: 10, min: 0 }));
