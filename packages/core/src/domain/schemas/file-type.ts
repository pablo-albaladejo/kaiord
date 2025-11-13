import { z } from "zod";

export const fileTypeSchema = z.enum(["workout", "activity", "course"]);

export type FileType = z.infer<typeof fileTypeSchema>;
