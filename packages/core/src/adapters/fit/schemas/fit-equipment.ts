import { z } from "zod";

export const fitEquipmentEnum = z.enum([
  "none",
  "swimFins",
  "swimKickboard",
  "swimPaddles",
  "swimPullBuoy",
  "swimSnorkel",
]);

export type FitEquipment = z.infer<typeof fitEquipmentEnum>;
