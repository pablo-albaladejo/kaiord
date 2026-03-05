import { z } from "zod";
import { krdSchema } from "@kaiord/core";

export const pushRequestSchema = z.object({
  krd: krdSchema,
  garmin: z.object({
    username: z.string().min(1),
    password: z.string().min(1),
  }),
});

export type PushRequest = z.infer<typeof pushRequestSchema>;
