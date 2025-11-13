import { faker } from "@faker-js/faker";
import { Factory } from "rosie";

type TimeDuration = { type: "time"; seconds: number };
type DistanceDuration = { type: "distance"; meters: number };
type OpenDuration = { type: "open" };

export const buildTimeDuration = new Factory<TimeDuration>()
  .attr("type", () => "time" as const)
  .attr("seconds", () => faker.number.int({ max: 3600, min: 30 }));

export const buildDistanceDuration = new Factory<DistanceDuration>()
  .attr("type", () => "distance" as const)
  .attr("meters", () => faker.number.int({ max: 10000, min: 100 }));

export const buildOpenDuration = new Factory<OpenDuration>().attr(
  "type",
  () => "open" as const
);
