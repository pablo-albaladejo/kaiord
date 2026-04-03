import { faker } from "@faker-js/faker";
import { Factory } from "rosie";
import type { Target } from "../../../domain/schemas/target";

const buildPowerValue = () => {
  const unit = faker.helpers.arrayElement([
    "watts",
    "percent_ftp",
    "zone",
    "range",
  ] as const);
  if (unit === "zone")
    return { unit, value: faker.number.int({ max: 7, min: 1 }) };
  if (unit === "range") {
    return {
      unit,
      min: faker.number.int({ max: 200, min: 100 }),
      max: faker.number.int({ max: 400, min: 250 }),
    };
  }
  if (unit === "percent_ftp")
    return { unit, value: faker.number.int({ max: 150, min: 50 }) };
  return { unit, value: faker.number.int({ max: 400, min: 100 }) };
};

const buildHeartRateValue = () => {
  const unit = faker.helpers.arrayElement([
    "bpm",
    "zone",
    "percent_max",
    "range",
  ] as const);
  if (unit === "zone")
    return { unit, value: faker.number.int({ max: 5, min: 1 }) };
  if (unit === "range") {
    return {
      unit,
      min: faker.number.int({ max: 140, min: 100 }),
      max: faker.number.int({ max: 180, min: 150 }),
    };
  }
  if (unit === "percent_max")
    return { unit, value: faker.number.int({ max: 100, min: 50 }) };
  return { unit, value: faker.number.int({ max: 200, min: 60 }) };
};

const buildCadenceValue = () => {
  const unit = faker.helpers.arrayElement(["rpm", "range"] as const);
  if (unit === "range") {
    return {
      unit,
      min: faker.number.int({ max: 80, min: 60 }),
      max: faker.number.int({ max: 110, min: 90 }),
    };
  }
  return { unit, value: faker.number.int({ max: 120, min: 60 }) };
};

const buildPaceValue = () => {
  const unit = faker.helpers.arrayElement(["mps", "zone", "range"] as const);
  if (unit === "zone")
    return { unit, value: faker.number.int({ max: 5, min: 1 }) };
  if (unit === "range") {
    return {
      unit,
      min: faker.number.float({ fractionDigits: 2, max: 4, min: 2 }),
      max: faker.number.float({ fractionDigits: 2, max: 6, min: 4.5 }),
    };
  }
  return {
    unit,
    value: faker.number.float({ fractionDigits: 2, max: 6, min: 2 }),
  };
};

const buildStrokeTypeValue = () => ({
  unit: "swim_stroke" as const,
  value: faker.number.int({ max: 5, min: 0 }),
});

const TARGET_TYPES = [
  "power",
  "heart_rate",
  "cadence",
  "pace",
  "stroke_type",
  "open",
] as const;

const TARGET_BUILDERS: Record<string, () => Target> = {
  power: () => ({ type: "power", value: buildPowerValue() }),
  heart_rate: () => ({ type: "heart_rate", value: buildHeartRateValue() }),
  cadence: () => ({ type: "cadence", value: buildCadenceValue() }),
  pace: () => ({ type: "pace", value: buildPaceValue() }),
  stroke_type: () => ({ type: "stroke_type", value: buildStrokeTypeValue() }),
  open: () => ({ type: "open" }),
};

export const buildTarget = new Factory<Target>()
  .attr("type", () => faker.helpers.arrayElement([...TARGET_TYPES]))
  .after((target) => {
    const builder = TARGET_BUILDERS[target.type];
    return Object.assign(target, builder());
  });
