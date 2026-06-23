import type { HrvSummary, Logger, SleepRecord } from "@kaiord/core";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

import { formatError, formatSuccess } from "../utils/error-formatter";
import { deriveRecoveryStatus } from "./health/derive-recovery-status";
import { latestOf, pickHealthByType } from "./health/health-record-filters";
import { parseHealthRecords } from "./health/parse-health-records";

const schema = {
  input_files: z
    .array(z.string())
    .describe("Paths to FIT/KRD files with HRV and/or sleep data"),
};

const extractSleep = (
  krd: ReturnType<typeof latestOf>
): SleepRecord | undefined => {
  const health = krd?.extensions?.health as Record<string, unknown> | undefined;
  return health?.sleep as SleepRecord | undefined;
};

const extractHrv = (
  krd: ReturnType<typeof latestOf>
): HrvSummary | undefined => {
  const health = krd?.extensions?.health as Record<string, unknown> | undefined;
  return health?.hrv as HrvSummary | undefined;
};

export const registerGetRecoveryStatusTool = (
  server: McpServer,
  logger: Logger
): void => {
  server.tool(
    "kaiord_get_recovery_status",
    "Derive a categorical recovery status from latest HRV and sleep",
    schema,
    async (args) => {
      try {
        const { records, skipped } = await parseHealthRecords(
          args.input_files,
          logger
        );
        const latestHrvKrd = latestOf(pickHealthByType(records, "hrv_summary"));
        const latestSleepKrd = latestOf(
          pickHealthByType(records, "sleep_record")
        );
        const hrv = extractHrv(latestHrvKrd);
        const sleep = extractSleep(latestSleepKrd);
        const { status, reason } = deriveRecoveryStatus(hrv, sleep);
        const payload = {
          status,
          reason,
          basedOn: {
            hrvAt: hrv?.measuredAt,
            sleepAt: sleep?.startTime,
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
