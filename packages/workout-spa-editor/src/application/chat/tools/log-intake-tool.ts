/**
 * log_intake chat action tool. Mirrors `createLogHealthMetricTool`:
 * `requiresConfirmation: true`, so the engine surfaces the call as a pending
 * action and the UI runs `execute` only after the user approves. The actual
 * persistence (closing over `logIntakeEntry`) is injected via `ChatActionOps`.
 */
import type { ChatTool } from "@kaiord/ai";
import { mealSlotSchema } from "@kaiord/core";
import { z } from "zod";

import type { ChatActionOps } from "./chat-tool-deps";

const nonNegative = z.number().nonnegative();

const logIntakeSchema = z.object({
  date: z.string().describe("Target date YYYY-MM-DD"),
  kcal: nonNegative.describe("Energy in kcal"),
  proteinG: nonNegative.describe("Protein grams"),
  carbG: nonNegative.describe("Carbohydrate grams"),
  fatG: nonNegative.describe("Fat grams"),
  label: z.string().optional().describe("Optional meal label"),
  mealSlot: mealSlotSchema.optional().describe("Optional meal slot"),
});

export const createLogIntakeTool = (ops: ChatActionOps): ChatTool => ({
  name: "log_intake",
  description:
    "Log a nutrition intake entry (kcal plus protein/carb/fat grams) for a " +
    "day, with an optional label and meal slot. Requires the user to confirm " +
    "before running.",
  inputSchema: logIntakeSchema,
  requiresConfirmation: true,
  execute: (raw) => ops.logIntake(logIntakeSchema.parse(raw)),
});
