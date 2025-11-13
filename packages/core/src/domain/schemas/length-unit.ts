import { z } from "zod";

export const lengthUnitEnum = z.enum(["meters", "yards"]);

export type LengthUnit = z.infer<typeof lengthUnitEnum>;
