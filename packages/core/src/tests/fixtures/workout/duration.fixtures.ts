import { faker } from "@faker-js/faker";
import { Factory } from "rosie";
import type { Duration } from "../../../domain/schemas/duration";

const DURATION_TYPES = [
  "time",
  "distance",
  "heart_rate_less_than",
  "repeat_until_heart_rate_greater_than",
  "calories",
  "power_less_than",
  "power_greater_than",
  "repeat_until_time",
  "repeat_until_distance",
  "repeat_until_calories",
  "repeat_until_heart_rate_less_than",
  "repeat_until_power_less_than",
  "repeat_until_power_greater_than",
  "open",
] as const;

const repeatFrom = () => faker.number.int({ max: 10, min: 0 });
const seconds = () => faker.number.int({ max: 3600, min: 30 });
const meters = () => faker.number.int({ max: 10000, min: 100 });
const bpm = () => faker.number.int({ max: 200, min: 60 });
const watts = () => faker.number.int({ max: 400, min: 100 });
const calories = () => faker.number.int({ max: 1000, min: 50 });

const DURATION_BUILDERS: Record<string, () => Duration> = {
  time: () => ({ type: "time", seconds: seconds() }),
  distance: () => ({ type: "distance", meters: meters() }),
  heart_rate_less_than: () => ({ type: "heart_rate_less_than", bpm: bpm() }),
  repeat_until_heart_rate_greater_than: () => ({
    type: "repeat_until_heart_rate_greater_than",
    bpm: bpm(),
    repeatFrom: repeatFrom(),
  }),
  calories: () => ({ type: "calories", calories: calories() }),
  power_less_than: () => ({ type: "power_less_than", watts: watts() }),
  power_greater_than: () => ({ type: "power_greater_than", watts: watts() }),
  repeat_until_time: () => ({
    type: "repeat_until_time",
    seconds: seconds(),
    repeatFrom: repeatFrom(),
  }),
  repeat_until_distance: () => ({
    type: "repeat_until_distance",
    meters: meters(),
    repeatFrom: repeatFrom(),
  }),
  repeat_until_calories: () => ({
    type: "repeat_until_calories",
    calories: calories(),
    repeatFrom: repeatFrom(),
  }),
  repeat_until_heart_rate_less_than: () => ({
    type: "repeat_until_heart_rate_less_than",
    bpm: bpm(),
    repeatFrom: repeatFrom(),
  }),
  repeat_until_power_less_than: () => ({
    type: "repeat_until_power_less_than",
    watts: watts(),
    repeatFrom: repeatFrom(),
  }),
  repeat_until_power_greater_than: () => ({
    type: "repeat_until_power_greater_than",
    watts: watts(),
    repeatFrom: repeatFrom(),
  }),
  open: () => ({ type: "open" }),
};

export const buildDuration = new Factory<Duration>()
  .attr("type", () => faker.helpers.arrayElement([...DURATION_TYPES]))
  .after((duration) => {
    const builder = DURATION_BUILDERS[duration.type];
    return Object.assign(duration, builder());
  });
