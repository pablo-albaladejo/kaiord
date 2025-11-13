import { faker } from "@faker-js/faker";
import { Factory } from "rosie";

type PowerLessThanDuration = { type: "power_less_than"; watts: number };
type PowerGreaterThanDuration = { type: "power_greater_than"; watts: number };
type RepeatUntilPowerLessThanDuration = {
  type: "repeat_until_power_less_than";
  watts: number;
  repeatFrom: number;
};
type RepeatUntilPowerGreaterThanDuration = {
  type: "repeat_until_power_greater_than";
  watts: number;
  repeatFrom: number;
};

export const buildPowerLessThanDuration = new Factory<PowerLessThanDuration>()
  .attr("type", () => "power_less_than" as const)
  .attr("watts", () => faker.number.int({ max: 500, min: 100 }));

export const buildPowerGreaterThanDuration =
  new Factory<PowerGreaterThanDuration>()
    .attr("type", () => "power_greater_than" as const)
    .attr("watts", () => faker.number.int({ max: 500, min: 100 }));

export const buildRepeatUntilPowerLessThanDuration =
  new Factory<RepeatUntilPowerLessThanDuration>()
    .attr("type", () => "repeat_until_power_less_than" as const)
    .attr("watts", () => faker.number.int({ max: 500, min: 100 }))
    .attr("repeatFrom", () => faker.number.int({ max: 10, min: 0 }));

export const buildRepeatUntilPowerGreaterThanDuration =
  new Factory<RepeatUntilPowerGreaterThanDuration>()
    .attr("type", () => "repeat_until_power_greater_than" as const)
    .attr("watts", () => faker.number.int({ max: 500, min: 100 }))
    .attr("repeatFrom", () => faker.number.int({ max: 10, min: 0 }));
