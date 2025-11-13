import { faker } from "@faker-js/faker";
import { Factory } from "rosie";
import type { KRDRecord } from "../../../domain/schemas/krd";

export const buildKRDRecord = new Factory<KRDRecord>()
  .attr("timestamp", () => faker.date.recent().toISOString())
  .attr("position", () => ({
    lat: faker.location.latitude(),
    lon: faker.location.longitude(),
  }))
  .attr("altitude", () => faker.number.float({ max: 3000, min: 0 }))
  .attr("heartRate", () => faker.number.int({ max: 200, min: 60 }))
  .attr("cadence", () => faker.number.int({ max: 120, min: 60 }))
  .attr("power", () => faker.number.int({ max: 500, min: 0 }))
  .attr("speed", () =>
    faker.number.float({ fractionDigits: 2, max: 15, min: 0 })
  )
  .attr("distance", () => faker.number.int({ max: 50000, min: 0 }));
