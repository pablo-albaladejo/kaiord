import { faker } from "@faker-js/faker";
import { Factory } from "rosie";

type CadenceTarget = {
  type: "cadence";
  value:
    | { unit: "rpm"; value: number }
    | { unit: "range"; min: number; max: number };
};

export const buildCadenceRpmTarget = new Factory<CadenceTarget>()
  .attr("type", () => "cadence" as const)
  .attr("value", () => ({
    unit: "rpm" as const,
    value: faker.number.int({ max: 120, min: 60 }),
  }));

export const buildCadenceRangeTarget = new Factory<CadenceTarget>()
  .attr("type", () => "cadence" as const)
  .attr("value", () => {
    const min = faker.number.int({ max: 80, min: 60 });
    const max = faker.number.int({ max: 120, min: min + 10 });
    return { unit: "range" as const, min, max };
  });
