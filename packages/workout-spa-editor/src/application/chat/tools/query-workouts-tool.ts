import { sportSchema } from "@kaiord/core";

import { defineReadTool } from "./define-read-tool";
import { summarizeWorkouts } from "./summarize-workouts";

const ROW_BUDGET = 50;

export const createQueryWorkoutsTool = defineReadTool({
  name: "query_workouts",
  description:
    "Read the user's workouts in a date range. Returns count, total and " +
    "longest duration, and per-workout summaries (id, date, sport, name, " +
    "state, duration, distance). Use it for questions about training history.",
  input: {
    sport: sportSchema
      .optional()
      .describe("Only return workouts of this sport; omit for all sports"),
  },
  rowsKey: "workouts",
  maxRows: ROW_BUDGET,
  read: async (readers, input, range) => {
    const records = await readers.workouts(range);
    const scoped = input.sport
      ? records.filter((w) => w.sport === input.sport)
      : records;
    const { workouts, ...summary } = summarizeWorkouts(scoped);
    return { rows: workouts, summary };
  },
});
