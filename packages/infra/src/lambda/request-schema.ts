import { z } from "zod";

export const pushRequestSchema = z.object({
  krd: z.record(z.string(), z.unknown()),
  garmin: z.object({
    username: z.string().min(1),
    password: z.string().min(1),
  }),
});

export type PushRequest = z.infer<typeof pushRequestSchema>;
