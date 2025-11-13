import { faker } from "@faker-js/faker";
import { Factory } from "rosie";

type PaceTarget = {
  type: "pace";
  value:
    | { unit: "mps"; value: number }
    | { unit: "zone"; value: number }
    | { unit: "range"; min: number; max: number };
};

export const buildPaceMpsTarget = new Factory<PaceTarget>()
  .attr("type", () => "pace" as const)
  .attr("value", () => ({
    unit: "mps" as const,
    value: faker.number.float({ max: 6.0, min: 2.0, fractionDigits: 2 }),
  }));

export const buildPaceZoneTarget = new Factory<PaceTarget>()
  .attr("type", () => "pace" as const)
  .attr("value", () => ({
    unit: "zone" as const,
    value: faker.number.int({ max: 5, min: 1 }),
  }));

export const buildPaceRangeTarget = new Factory<PaceTarget>()
  .attr("type", () => "pace" as const)
  .attr("value", () => {
    const min = faker.number.float({ max: 3.0, min: 2.0, fractionDigits: 2 });
    const max = faker.number.float({
      max: 6.0,
      min: min + 0.5,
      fractionDigits: 2,
    });
    return { unit: "range" as const, min, max };
  });
