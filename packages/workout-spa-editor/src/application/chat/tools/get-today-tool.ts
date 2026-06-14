import type { ChatTool } from "@kaiord/ai";
import { z } from "zod";

import { getWeekIdForDate, parseWeekId } from "../../../utils/week-utils";
import type { ReadToolDeps } from "./chat-tool-deps";

const inputSchema = z.object({});

export const createGetTodayTool = (
  deps: Pick<ReadToolDeps, "today">
): ChatTool => ({
  name: "get_today",
  description:
    "Resolve the current date and ISO week. Call this before answering any " +
    'question that mentions "today", "this week", or other relative dates — ' +
    "never guess the current date.",
  inputSchema,
  requiresConfirmation: false,
  execute: async () => {
    const weekId = getWeekIdForDate(new Date(`${deps.today}T12:00:00.000Z`));
    const week = parseWeekId(weekId);
    return {
      today: deps.today,
      weekId,
      weekStart: week?.start ?? null,
      weekEnd: week?.end ?? null,
    };
  },
});
