import { z } from "zod";

export const fileTypeSchema = z.enum([
  "structured_workout",
  "recorded_activity",
  "course",
]);

export type FileType = z.infer<typeof fileTypeSchema>;
