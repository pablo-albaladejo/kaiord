import { z } from "zod";

export const unitKeySchema = z
  .enum(["meter", "kilometer", "mile", "yard", "foot", "kilogram", "pound"])
  .nullable();

export const garminUnitSchema = z.object({
  unitId: z.number().int().positive().nullable(),
  unitKey: unitKeySchema,
  factor: z.number().positive().nullable(),
});

export type GarminUnit = z.infer<typeof garminUnitSchema>;
