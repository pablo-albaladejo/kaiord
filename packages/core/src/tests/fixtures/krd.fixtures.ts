import { faker } from "@faker-js/faker";
import { Factory } from "rosie";
import type {
  KRD,
  KRDEvent,
  KRDLap,
  KRDMetadata,
  KRDRecord,
  KRDSession,
} from "../../domain/schemas/krd";

export const buildKRDMetadata = new Factory<KRDMetadata>()
  .attr("created", () => faker.date.recent().toISOString())
  .attr("manufacturer", () =>
    faker.helpers.arrayElement(["garmin", "wahoo", "polar", "suunto"])
  )
  .attr("product", () =>
    faker.helpers.arrayElement(["fenix7", "edge530", "forerunner945", "elemnt"])
  )
  .attr("serialNumber", () => faker.string.numeric(10))
  .attr("sport", () =>
    faker.helpers.arrayElement(["running", "cycling", "swimming"])
  )
  .attr("subSport", () =>
    faker.helpers.arrayElement(["trail", "road", "track", "indoor"])
  );

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

export const buildKRDLap = new Factory<KRDLap>()
  .attr("startTime", () => faker.date.recent().toISOString())
  .attr("totalElapsedTime", () => faker.number.int({ max: 1800, min: 30 }))
  .attr("totalDistance", () => faker.number.int({ max: 10000, min: 100 }))
  .attr("avgHeartRate", () => faker.number.int({ max: 200, min: 60 }))
  .attr("maxHeartRate", () => faker.number.int({ max: 220, min: 100 }))
  .attr("avgCadence", () => faker.number.int({ max: 120, min: 60 }))
  .attr("avgPower", () => faker.number.int({ max: 400, min: 100 }));

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

export const buildKRDEvent = new Factory<KRDEvent>()
  .attr("timestamp", () => faker.date.recent().toISOString())
  .attr("eventType", () =>
    faker.helpers.arrayElement([
      "start",
      "stop",
      "pause",
      "resume",
      "lap",
      "marker",
      "timer",
    ] as const)
  )
  .attr("eventGroup", () => faker.number.int({ max: 10, min: 0 }))
  .attr("data", () => faker.number.int({ max: 255, min: 0 }));

export const buildKRD = new Factory<KRD>()
  .attr("version", () => "1.0")
  .attr("type", () =>
    faker.helpers.arrayElement(["workout", "activity", "course"] as const)
  )
  .attr("metadata", () => buildKRDMetadata.build())
  .attr("sessions", () => [buildKRDSession.build()])
  .attr("laps", () => [buildKRDLap.build(), buildKRDLap.build()])
  .attr("records", () => [
    buildKRDRecord.build(),
    buildKRDRecord.build(),
    buildKRDRecord.build(),
  ])
  .attr("events", () => [buildKRDEvent.build()])
  .attr("extensions", () => ({
    fit: {
      developerFields: [],
    },
  }));
