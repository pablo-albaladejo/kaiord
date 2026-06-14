import type { ChatTool } from "@kaiord/ai";
import { z } from "zod";

import type { ReadToolDeps } from "./chat-tool-deps";
import { clampRange } from "./clamp-range";
import { summarizeWorkouts } from "./summarize-workouts";

const inputSchema = z.object({
  dateFrom: z.string().optional().describe("Start date YYYY-MM-DD"),
  dateTo: z
    .string()
    .optional()
    .describe("End date YYYY-MM-DD (defaults today)"),
  sport: z.string().optional().describe("Filter to one sport, e.g. running"),
});

export const createQueryWorkoutsTool = (deps: ReadToolDeps): ChatTool => ({
  name: "query_workouts",
  description:
    "Read the user's workouts in a date range. Returns count, total and " +
    "longest duration, and per-workout summaries (date, sport, name, state, " +
    "duration, distance). Use it for questions about training history.",
  inputSchema,
  requiresConfirmation: false,
  execute: async (raw) => {
    const input = inputSchema.parse(raw);
    const range = clampRange(input, deps.today);
    const all = await deps.persistence.workouts.getByDateRange(
      range.from,
      range.to
    );
    const mine = all.filter((w) => w.profileId === deps.profileId);
    const scoped = input.sport
      ? mine.filter((w) => w.sport === input.sport)
      : mine;
    return { range_used: range, ...summarizeWorkouts(scoped) };
  },
});
