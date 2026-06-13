import type { ChatTool } from "@kaiord/ai";
import { z } from "zod";

import type { PersistencePort } from "../../../ports/persistence-port";
import type { ReadToolDeps } from "./chat-tool-deps";
import { clampRange } from "./clamp-range";
import { summarizeHealth } from "./summarize-health";

// Minimal read surface shared by every health store; loose enough that each
// per-metric `HealthRecordRepository<T>` is assignable regardless of its KRD
// payload type (the summarizer only reads `date` + `krd`).
type HealthReader = {
  getByProfileAndDateRange: (
    profileId: string,
    from: string,
    to: string
  ) => Promise<ReadonlyArray<{ date: string; krd: unknown }>>;
};

const HEALTH_METRICS = [
  "sleep",
  "weight",
  "hrv",
  "daily-wellness",
  "body-composition",
  "stress",
] as const;
type HealthMetric = (typeof HEALTH_METRICS)[number];

// Keyed on the finite metric union (not `string`) so the indexed access is a
// known-present property, not an index-signature lookup — required under the
// build's `noUncheckedIndexedAccess`.
const REPO_BY_METRIC: Record<
  HealthMetric,
  (p: PersistencePort) => HealthReader
> = {
  sleep: (p) => p.healthSleep,
  weight: (p) => p.healthWeight,
  hrv: (p) => p.healthHrv,
  "daily-wellness": (p) => p.healthDaily,
  "body-composition": (p) => p.healthBodyComposition,
  stress: (p) => p.healthStress,
};

const inputSchema = z.object({
  metric: z.enum(HEALTH_METRICS),
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
    const records = await repo.getByProfileAndDateRange(
      deps.profileId,
      range.from,
      range.to
    );
    return {
      range_used: range,
      metric: input.metric,
      ...summarizeHealth(records),
    };
  },
});
