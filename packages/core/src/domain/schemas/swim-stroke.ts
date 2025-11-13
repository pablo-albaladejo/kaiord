import { z } from "zod";

export const swimStrokeEnum = z.enum([
  "freestyle",
  "backstroke",
  "breaststroke",
  "butterfly",
  "drill",
  "mixed",
  "im",
]);

export type SwimStroke = z.infer<typeof swimStrokeEnum>;

export const SWIM_STROKE_TO_FIT = {
  freestyle: 0,
  backstroke: 1,
  breaststroke: 2,
  butterfly: 3,
  drill: 4,
  mixed: 5,
  im: 5,
} as const satisfies Record<SwimStroke, number>;

export const FIT_TO_SWIM_STROKE: Record<number, SwimStroke> = {
  0: "freestyle",
  1: "backstroke",
  2: "breaststroke",
  3: "butterfly",
  4: "drill",
  5: "mixed",
};
