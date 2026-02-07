import { faker } from "@faker-js/faker";
import { Factory } from "rosie";
import type { KRDEvent } from "../../../domain/schemas/krd";

export const buildKRDEvent = new Factory<KRDEvent>()
  .attr("timestamp", () => faker.date.recent().toISOString())
  .attr("eventType", () =>
    faker.helpers.arrayElement([
      "event_start",
      "event_stop",
      "event_pause",
      "event_resume",
      "event_lap",
      "event_marker",
      "event_timer",
    ] as const)
  )
  .attr("eventGroup", () => faker.number.int({ max: 10, min: 0 }))
  .attr("data", () => faker.number.int({ max: 255, min: 0 }));
