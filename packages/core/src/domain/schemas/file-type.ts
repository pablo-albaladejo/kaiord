import { z } from "zod";

export const fileTypeEnum = z.enum(["workout", "activity", "course"]);

export type FileType = z.infer<typeof fileTypeEnum>;
