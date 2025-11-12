import { faker } from "@faker-js/faker";
import { Factory } from "rosie";
import { targetSchema } from "../../domain/schemas/target";

type PowerTarget = {
  type: "power";
  value:
    | { unit: "watts"; value: number }
    | { unit: "percent_ftp"; value: number }
    | { unit: "zone"; value: number }
    | { unit: "range"; min: number; max: number };
};

type HeartRateTarget = {
  type: "heart_rate";
  value:
    | { unit: "bpm"; value: number }
    | { unit: "zone"; value: number }
    | { unit: "percent_max"; value: number }
    | { unit: "range"; min: number; max: number };
};

type CadenceTarget = {
  type: "cadence";
  value:
    | { unit: "rpm"; value: number }
    | { unit: "range"; min: number; max: number };
};

type PaceTarget = {
  type: "pace";
  value:
    | { unit: "mps"; value: number }
    | { unit: "zone"; value: number }
    | { unit: "range"; min: number; max: number };
};

type OpenTarget = { type: "open" };

export const buildPowerWattsTarget = new Factory<PowerTarget>()
  .attr("type", () => "power" as const)
  .attr("value", () => ({
    unit: "watts" as const,
    value: faker.number.int({ max: 400, min: 100 }),
  }))
  .after((target) => {
    targetSchema.parse(target);
  });

export const buildPowerFtpTarget = new Factory<PowerTarget>()
  .attr("type", () => "power" as const)
  .attr("value", () => ({
    unit: "percent_ftp" as const,
    value: faker.number.int({ max: 150, min: 50 }),
  }))
  .after((target) => {
    targetSchema.parse(target);
  });

export const buildPowerZoneTarget = new Factory<PowerTarget>()
  .attr("type", () => "power" as const)
  .attr("value", () => ({
    unit: "zone" as const,
    value: faker.number.int({ max: 7, min: 1 }),
  }))
  .after((target) => {
    targetSchema.parse(target);
  });

export const buildPowerRangeTarget = new Factory<PowerTarget>()
  .attr("type", () => "power" as const)
  .attr("value", () => {
    const min = faker.number.int({ max: 300, min: 100 });
    const max = faker.number.int({ max: 400, min: min + 10 });
    return { unit: "range" as const, min, max };
  })
  .after((target) => {
    targetSchema.parse(target);
  });

export const buildHeartRateBpmTarget = new Factory<HeartRateTarget>()
  .attr("type", () => "heart_rate" as const)
  .attr("value", () => ({
    unit: "bpm" as const,
    value: faker.number.int({ max: 200, min: 60 }),
  }))
  .after((target) => {
    targetSchema.parse(target);
  });

export const buildHeartRateZoneTarget = new Factory<HeartRateTarget>()
  .attr("type", () => "heart_rate" as const)
  .attr("value", () => ({
    unit: "zone" as const,
    value: faker.number.int({ max: 5, min: 1 }),
  }))
  .after((target) => {
    targetSchema.parse(target);
  });

export const buildHeartRatePercentMaxTarget = new Factory<HeartRateTarget>()
  .attr("type", () => "heart_rate" as const)
  .attr("value", () => ({
    unit: "percent_max" as const,
    value: faker.number.int({ max: 100, min: 50 }),
  }))
  .after((target) => {
    targetSchema.parse(target);
  });

export const buildHeartRateRangeTarget = new Factory<HeartRateTarget>()
  .attr("type", () => "heart_rate" as const)
  .attr("value", () => {
    const min = faker.number.int({ max: 150, min: 60 });
    const max = faker.number.int({ max: 200, min: min + 10 });
    return { unit: "range" as const, min, max };
  })
  .after((target) => {
    targetSchema.parse(target);
  });

export const buildCadenceRpmTarget = new Factory<CadenceTarget>()
  .attr("type", () => "cadence" as const)
  .attr("value", () => ({
    unit: "rpm" as const,
    value: faker.number.int({ max: 120, min: 60 }),
  }))
  .after((target) => {
    targetSchema.parse(target);
  });

export const buildCadenceRangeTarget = new Factory<CadenceTarget>()
  .attr("type", () => "cadence" as const)
  .attr("value", () => {
    const min = faker.number.int({ max: 80, min: 60 });
    const max = faker.number.int({ max: 120, min: min + 10 });
    return { unit: "range" as const, min, max };
  })
  .after((target) => {
    targetSchema.parse(target);
  });

export const buildPaceMpsTarget = new Factory<PaceTarget>()
  .attr("type", () => "pace" as const)
  .attr("value", () => ({
    unit: "mps" as const,
    value: faker.number.float({ max: 6.0, min: 2.0, fractionDigits: 2 }),
  }))
  .after((target) => {
    targetSchema.parse(target);
  });

export const buildPaceZoneTarget = new Factory<PaceTarget>()
  .attr("type", () => "pace" as const)
  .attr("value", () => ({
    unit: "zone" as const,
    value: faker.number.int({ max: 5, min: 1 }),
  }))
  .after((target) => {
    targetSchema.parse(target);
  });

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
  })
  .after((target) => {
    targetSchema.parse(target);
  });

export const buildOpenTarget = new Factory<OpenTarget>()
  .attr("type", () => "open" as const)
  .after((target) => {
    targetSchema.parse(target);
  });
