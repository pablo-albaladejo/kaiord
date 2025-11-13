import { z } from "zod";

export const sportEnum = z.enum(["cycling", "running", "swimming", "generic"]);

export type Sport = z.infer<typeof sportEnum>;
