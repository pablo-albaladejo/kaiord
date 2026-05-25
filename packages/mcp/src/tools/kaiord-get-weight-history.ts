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
    .describe("Paths to FIT/KRD files containing weight measurements"),
  limit: z
    .number()
    .int()
    .positive()
    .optional()
    .describe("Maximum number of records to return (most recent kept)"),
};

export const registerGetWeightHistoryTool = (
  server: McpServer,
  logger: Logger
): void => {
  server.tool(
    "kaiord_get_weight_history",
    "List weight measurements from input files sorted by measuredAt ascending",
    schema,
    async (args) => {
      try {
        const { records: krds, skipped } = await parseHealthRecords(
          args.input_files,
          logger
        );
        const weightKrds = sortByHealthDate(
          pickHealthByType(krds, "weight_measurement")
        );
        const total = weightKrds.length;
        const limited =
          args.limit !== undefined ? weightKrds.slice(-args.limit) : weightKrds;
        const weightRecords = limited
          .map(
            (k) =>
              (k.extensions?.health as Record<string, unknown> | undefined)
                ?.weight
          )
          .filter((v): v is Record<string, unknown> => v !== undefined);
        return formatSuccess(
          JSON.stringify({ records: weightRecords, total, skipped })
        );
      } catch (error) {
        return formatError(error);
      }
    }
  );
};
