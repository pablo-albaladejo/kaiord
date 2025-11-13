import { z } from "zod";

export const lengthUnitSchema = z.enum(["meters", "yards"]);

export type LengthUnit = z.infer<typeof lengthUnitSchema>;
