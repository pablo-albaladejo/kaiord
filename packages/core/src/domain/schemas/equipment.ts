import { z } from "zod";

export const equipmentSchema = z.enum([
  "none",
  "swim_fins",
  "swim_kickboard",
  "swim_paddles",
  "swim_pull_buoy",
  "swim_snorkel",
]);

export type Equipment = z.infer<typeof equipmentSchema>;
