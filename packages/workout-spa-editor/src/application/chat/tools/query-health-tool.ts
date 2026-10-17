import type { ChatTool } from "@kaiord/ai";
import { z } from "zod";

import type { ReadToolDeps } from "./chat-tool-deps";
import { defineReadTool } from "./define-read-tool";
import { HEALTH_METRICS } from "./profile-readers";
import { summarizeHealth } from "./summarize-health";

const ROW_BUDGET = 90;

const queryHealth = defineReadTool({
  input: {
    metric: z.enum(HEALTH_METRICS).describe("Health metric to read"),
  },
  rowsKey: "records",
  maxRows: ROW_BUDGET,
  read: async (readers, input, range) => {
    const { records, count } = summarizeHealth(
      input.metric,
      await readers.health(input.metric, range)
    );
    return { rows: records, summary: { metric: input.metric, count } };
  },
});

export const createQueryHealthTool = (deps: ReadToolDeps): ChatTool => ({
  name: "query_health",
  description:
    "Read the user's health metrics (sleep, weight, hrv, daily-wellness, " +
    "body-composition, stress) in a date range. Returns count and per-day " +
    "numeric readings for the metric. Use it for questions about sleep, " +
    "weight, recovery, etc.",
  ...queryHealth(deps),
});
