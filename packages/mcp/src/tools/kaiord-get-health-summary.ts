import type { Logger } from "@kaiord/core";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

import { formatError, formatSuccess } from "../utils/error-formatter";
import { latestOf, pickHealthByType } from "./health/health-record-filters";
import { parseHealthRecords } from "./health/parse-health-records";

const schema = {
  input_files: z
    .array(z.string())
    .describe("Paths to health FIT/KRD files to summarize"),
};

const extractHealth = (
  krd: ReturnType<typeof latestOf>,
  key: "sleep" | "weight" | "hrv" | "daily"
): unknown => {
  if (!krd) return undefined;
  const health = krd.extensions?.health as Record<string, unknown> | undefined;
  return health?.[key];
};

export const registerGetHealthSummaryTool = (
  server: McpServer,
  logger: Logger
): void => {
  server.tool(
    "kaiord_get_health_summary",
    "Summarize the latest health record per metric across input files",
    schema,
    async (args) => {
      try {
        const { records, skipped } = await parseHealthRecords(
          args.input_files,
          logger
        );
        const sleepKrds = pickHealthByType(records, "sleep_record");
        const weightKrds = pickHealthByType(records, "weight_measurement");
        const hrvKrds = pickHealthByType(records, "hrv_summary");
        const dailyKrds = pickHealthByType(records, "daily_wellness");
        const payload = {
          latest: {
            sleep: extractHealth(latestOf(sleepKrds), "sleep"),
            weight: extractHealth(latestOf(weightKrds), "weight"),
            hrv: extractHealth(latestOf(hrvKrds), "hrv"),
            daily: extractHealth(latestOf(dailyKrds), "daily"),
          },
          counts: {
            sleep: sleepKrds.length,
            weight: weightKrds.length,
            hrv: hrvKrds.length,
            daily: dailyKrds.length,
          },
          skipped,
        };
        return formatSuccess(JSON.stringify(payload));
      } catch (error) {
        return formatError(error);
      }
    }
  );
};
