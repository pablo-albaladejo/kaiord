import { faker } from "@faker-js/faker";
import { Factory } from "rosie";

type PowerTarget = {
  type: "power";
  value:
    | { unit: "watts"; value: number }
    | { unit: "percent_ftp"; value: number }
    | { unit: "zone"; value: number }
    | { unit: "range"; min: number; max: number };
};

export const buildPowerWattsTarget = new Factory<PowerTarget>()
  .attr("type", () => "power" as const)
  .attr("value", () => ({
    unit: "watts" as const,
    value: faker.number.int({ max: 400, min: 100 }),
  }));

export const buildPowerFtpTarget = new Factory<PowerTarget>()
  .attr("type", () => "power" as const)
  .attr("value", () => ({
    unit: "percent_ftp" as const,
    value: faker.number.int({ max: 150, min: 50 }),
  }));

export const buildPowerZoneTarget = new Factory<PowerTarget>()
  .attr("type", () => "power" as const)
  .attr("value", () => ({
    unit: "zone" as const,
    value: faker.number.int({ max: 7, min: 1 }),
  }));

export const buildPowerRangeTarget = new Factory<PowerTarget>()
  .attr("type", () => "power" as const)
  .attr("value", () => {
    const min = faker.number.int({ max: 300, min: 100 });
    const max = faker.number.int({ max: 400, min: min + 10 });
    return { unit: "range" as const, min, max };
  });
