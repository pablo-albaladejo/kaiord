import type { ChatTool } from "@kaiord/ai";
import { z } from "zod";

import type { HealthRecord } from "../../../ports/health-record-repository";
import type { PersistencePort } from "../../../ports/persistence-port";
import type { ReadToolDeps } from "./chat-tool-deps";
import { clampRange } from "./clamp-range";
import { summarizeHealth } from "./summarize-health";

type HealthRepo = {
  getByProfileAndDateRange: PersistencePort["healthSleep"]["getByProfileAndDateRange"];
};

const REPO_BY_METRIC: Record<string, (p: PersistencePort) => HealthRepo> = {
  sleep: (p) => p.healthSleep,
  weight: (p) => p.healthWeight,
  hrv: (p) => p.healthHrv,
  "daily-wellness": (p) => p.healthDaily,
  "body-composition": (p) => p.healthBodyComposition,
  stress: (p) => p.healthStress,
};

const inputSchema = z.object({
  metric: z.enum([
    "sleep",
    "weight",
    "hrv",
    "daily-wellness",
    "body-composition",
    "stress",
  ]),
  dateFrom: z.string().optional().describe("Start date YYYY-MM-DD"),
  dateTo: z
    .string()
    .optional()
    .describe("End date YYYY-MM-DD (defaults today)"),
});

export const createQueryHealthTool = (deps: ReadToolDeps): ChatTool => ({
  name: "query_health",
  description:
    "Read the user's health metrics (sleep, weight, hrv, daily-wellness, " +
    "body-composition, stress) in a date range. Returns count and per-day " +
    "records. Use it for questions about sleep, weight, recovery, etc.",
  inputSchema,
  requiresConfirmation: false,
  execute: async (raw) => {
    const input = inputSchema.parse(raw);
    const range = clampRange(input, deps.today);
    const repo = REPO_BY_METRIC[input.metric](deps.persistence);
    const records = (await repo.getByProfileAndDateRange(
      deps.profileId,
      range.from,
      range.to
    )) as ReadonlyArray<HealthRecord<unknown>>;
    return {
      range_used: range,
      metric: input.metric,
      ...summarizeHealth(records),
    };
  },
});
