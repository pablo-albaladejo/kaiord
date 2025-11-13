import { faker } from "@faker-js/faker";
import { Factory } from "rosie";
import type { KRDSession } from "../../../domain/schemas/krd";

export const buildKRDSession = new Factory<KRDSession>()
  .attr("startTime", () => faker.date.recent().toISOString())
  .attr("totalElapsedTime", () => faker.number.int({ max: 7200, min: 60 }))
  .attr("totalTimerTime", () => faker.number.int({ max: 7200, min: 60 }))
  .attr("totalDistance", () => faker.number.int({ max: 50000, min: 1000 }))
  .attr("sport", () =>
    faker.helpers.arrayElement(["running", "cycling", "swimming"])
  )
  .attr("subSport", () =>
    faker.helpers.arrayElement(["trail", "road", "track", "indoor"])
  )
  .attr("avgHeartRate", () => faker.number.int({ max: 200, min: 60 }))
  .attr("maxHeartRate", () => faker.number.int({ max: 220, min: 100 }))
  .attr("avgCadence", () => faker.number.int({ max: 120, min: 60 }))
  .attr("avgPower", () => faker.number.int({ max: 400, min: 100 }))
  .attr("totalCalories", () => faker.number.int({ max: 2000, min: 100 }));
