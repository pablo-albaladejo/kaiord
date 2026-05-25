import type { Logger } from "@kaiord/core";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

import { formatError, formatSuccess } from "../utils/error-formatter";
import {
  pickHealthByType,
  sortByHealthDate,
} from "./health/health-record-filters";
import { parseHealthRecords } from "./health/parse-health-records";

const schema = {
  input_files: z
    .array(z.string())
    .describe("Paths to FIT/KRD files containing sleep records"),
  limit: z
    .number()
    .int()
    .positive()
    .optional()
    .describe("Maximum number of records to return (most recent kept)"),
};

export const registerGetSleepHistoryTool = (
  server: McpServer,
  logger: Logger
): void => {
  server.tool(
    "kaiord_get_sleep_history",
    "List sleep records from input files sorted by startTime ascending",
    schema,
    async (args) => {
      try {
        const { records: krds, skipped } = await parseHealthRecords(
          args.input_files,
          logger
        );
        const sleepKrds = sortByHealthDate(
          pickHealthByType(krds, "sleep_record")
        );
        const total = sleepKrds.length;
        const limited =
          args.limit !== undefined ? sleepKrds.slice(-args.limit) : sleepKrds;
        const sleepRecords = limited
          .map(
            (k) =>
              (k.extensions?.health as Record<string, unknown> | undefined)
                ?.sleep
          )
          .filter((v): v is Record<string, unknown> => v !== undefined);
        return formatSuccess(
          JSON.stringify({ records: sleepRecords, total, skipped })
        );
      } catch (error) {
        return formatError(error);
      }
    }
  );
};
