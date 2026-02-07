import { z } from "zod";

export const fitSportSchema = z.enum([
  "cycling",
  "running",
  "swimming",
  "generic",
]);

export type FitSport = z.infer<typeof fitSportSchema>;
