import type { ChatTool } from "@kaiord/ai";
import { z } from "zod";

import type { ChatActionOps } from "./chat-tool-deps";

/**
 * Action-tool factories. Each is `requiresConfirmation: true`, so the chat
 * engine surfaces the call as a pending action and never runs `execute`
 * itself — the UI runs it only after the user approves, then resumes the
 * turn with the result. The side-effecting operations are injected
 * (`ChatActionOps`) so this layer wraps existing use cases without touching
 * React, Dexie, or the bridges directly.
 */

export const createSyncCoachingTool = (ops: ChatActionOps): ChatTool => ({
  name: "sync_coaching",
  description:
    "Sync the latest prescribed activities from the coaching provider " +
    "(Train2Go). Requires the user to confirm before running.",
  inputSchema: z.object({}),
  requiresConfirmation: true,
  execute: () => ops.syncCoaching(),
});

const createWorkoutSchema = z.object({
  description: z
    .string()
    .min(1)
    .describe("Natural-language workout description to generate from"),
  date: z.string().describe("Target date YYYY-MM-DD"),
  sport: z.string().optional().describe("Optional sport hint"),
});

export const createCreateWorkoutTool = (ops: ChatActionOps): ChatTool => ({
  name: "create_workout",
  description:
    "Generate a workout from a natural-language description and save it on " +
    "a date. Requires the user to confirm before running.",
  inputSchema: createWorkoutSchema,
  requiresConfirmation: true,
  execute: (raw) => ops.createWorkout(createWorkoutSchema.parse(raw)),
});

const logHealthSchema = z.object({
  metric: z.enum(["weight", "sleep", "hrv", "daily-wellness"]),
  day: z.string().describe("Date YYYY-MM-DD"),
  value: z
    .number()
    .describe("Metric value (sleep hours, weight kg, hrv ms, or steps)"),
});

export const createLogHealthMetricTool = (ops: ChatActionOps): ChatTool => ({
  name: "log_health_metric",
  description:
    "Log a manual health metric (sleep hours, weight, hrv, or daily steps) " +
    "for a day. Requires the user to confirm before running.",
  inputSchema: logHealthSchema,
  requiresConfirmation: true,
  execute: (raw) => ops.logHealthMetric(logHealthSchema.parse(raw)),
});
