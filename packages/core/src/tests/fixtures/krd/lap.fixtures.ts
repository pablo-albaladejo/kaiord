import { faker } from "@faker-js/faker";
import { Factory } from "rosie";
import type { KRDLap } from "../../../domain/schemas/krd";

export const buildKRDLap = new Factory<KRDLap>()
  .attr("startTime", () => faker.date.recent().toISOString())
  .attr("totalElapsedTime", () => faker.number.int({ max: 1800, min: 30 }))
  .attr("totalDistance", () => faker.number.int({ max: 10000, min: 100 }))
  .attr("avgHeartRate", () => faker.number.int({ max: 200, min: 60 }))
  .attr("maxHeartRate", () => faker.number.int({ max: 220, min: 100 }))
  .attr("avgCadence", () => faker.number.int({ max: 120, min: 60 }))
  .attr("avgPower", () => faker.number.int({ max: 400, min: 100 }));
