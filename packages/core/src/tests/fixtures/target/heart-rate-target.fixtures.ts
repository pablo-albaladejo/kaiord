import { faker } from "@faker-js/faker";
import { Factory } from "rosie";

type HeartRateTarget = {
  type: "heart_rate";
  value:
    | { unit: "bpm"; value: number }
    | { unit: "zone"; value: number }
    | { unit: "percent_max"; value: number }
    | { unit: "range"; min: number; max: number };
};

export const buildHeartRateBpmTarget = new Factory<HeartRateTarget>()
  .attr("type", () => "heart_rate" as const)
  .attr("value", () => ({
    unit: "bpm" as const,
    value: faker.number.int({ max: 200, min: 60 }),
  }));

export const buildHeartRateZoneTarget = new Factory<HeartRateTarget>()
  .attr("type", () => "heart_rate" as const)
  .attr("value", () => ({
    unit: "zone" as const,
    value: faker.number.int({ max: 5, min: 1 }),
  }));

export const buildHeartRatePercentMaxTarget = new Factory<HeartRateTarget>()
  .attr("type", () => "heart_rate" as const)
  .attr("value", () => ({
    unit: "percent_max" as const,
    value: faker.number.int({ max: 100, min: 50 }),
  }));

export const buildHeartRateRangeTarget = new Factory<HeartRateTarget>()
  .attr("type", () => "heart_rate" as const)
  .attr("value", () => {
    const min = faker.number.int({ max: 150, min: 60 });
    const max = faker.number.int({ max: 200, min: min + 10 });
    return { unit: "range" as const, min, max };
  });
