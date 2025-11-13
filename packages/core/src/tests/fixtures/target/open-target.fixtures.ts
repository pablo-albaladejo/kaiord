import { Factory } from "rosie";

type OpenTarget = { type: "open" };

export const buildOpenTarget = new Factory<OpenTarget>().attr(
  "type",
  () => "open" as const
);
