import { z } from "zod";

export const fitSportEnum = z.enum([
  "cycling",
  "running",
  "swimming",
  "generic",
]);

export type FitSport = z.infer<typeof fitSportEnum>;
