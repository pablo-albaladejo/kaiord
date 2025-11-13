import { z } from "zod";

export const fitEquipmentSchema = z.enum([
  "none",
  "swimFins",
  "swimKickboard",
  "swimPaddles",
  "swimPullBuoy",
  "swimSnorkel",
]);

export type FitEquipment = z.infer<typeof fitEquipmentSchema>;
