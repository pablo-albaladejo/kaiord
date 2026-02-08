import { z } from "zod";

export const equipmentTypeKeySchema = z
  .enum(["none", "fins", "kickboard", "paddles", "pull_buoy", "snorkel"])
  .nullable();

export const garminEquipmentTypeSchema = z.object({
  equipmentTypeId: z.number().int().nonnegative(),
  equipmentTypeKey: equipmentTypeKeySchema,
  displayOrder: z.number().int().nonnegative(),
});

export type GarminEquipmentType = z.infer<typeof garminEquipmentTypeSchema>;
