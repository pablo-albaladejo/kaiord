import { faker } from "@faker-js/faker";
import { Factory } from "rosie";
import type { KRD } from "../../../domain/schemas/krd";
import { buildKRDEvent } from "./event.fixtures";
import { buildKRDLap } from "./lap.fixtures";
import { buildKRDMetadata } from "./metadata.fixtures";
import { buildKRDRecord } from "./record.fixtures";
import { buildKRDSession } from "./session.fixtures";

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
