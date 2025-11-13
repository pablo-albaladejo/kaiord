import { z } from "zod";

export const sportSchema = z.enum([
  "cycling",
  "running",
  "swimming",
  "generic",
]);

export type Sport = z.infer<typeof sportSchema>;
