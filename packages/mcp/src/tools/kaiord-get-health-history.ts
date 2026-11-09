import type { Logger } from "@kaiord/core";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

import { formatError, formatSuccess } from "../utils/error-formatter";
import {
  type HealthKrdType,
  pickHealthByType,
  sortByHealthDate,
} from "./health/health-record-filters";
import { parseHealthRecords } from "./health/parse-health-records";

type HealthHistorySpec = {
  /** Tool name registered with the server. */
  name: string;
  description: string;
  /** What the input files contain, for the `input_files` argument. */
  inputNoun: string;
  /** KRD `type` selected from the parsed files. */
  krdType: HealthKrdType;
  /** Key under `extensions.health` holding the record to return. */
  healthKey: string;
};

const createRegisterHealthHistoryTool =
  (spec: HealthHistorySpec) =>
  (server: McpServer, logger: Logger): void => {
    const schema = {
      input_files: z
        .array(z.string())
        .describe(`Paths to FIT/KRD files containing ${spec.inputNoun}`),
      limit: z
        .number()
        .int()
        .positive()
        .optional()
        .describe("Maximum number of records to return (most recent kept)"),
    };

    server.tool(spec.name, spec.description, schema, async (args) => {
      try {
        const { records: krds, skipped } = await parseHealthRecords(
          args.input_files,
          logger
        );
        const matching = sortByHealthDate(pickHealthByType(krds, spec.krdType));
        const total = matching.length;
        const limited =
          args.limit !== undefined ? matching.slice(-args.limit) : matching;
        const records = limited
          .map(
            (k) =>
              (k.extensions?.health as Record<string, unknown> | undefined)?.[
                spec.healthKey
              ]
          )
          .filter((v): v is Record<string, unknown> => v !== undefined);
        return formatSuccess(JSON.stringify({ records, total, skipped }));
      } catch (error) {
        return formatError(error);
      }
    });
  };

export const registerGetSleepHistoryTool = createRegisterHealthHistoryTool({
  name: "kaiord_get_sleep_history",
  description:
    "List sleep records from input files sorted by startTime ascending",
  inputNoun: "sleep records",
  krdType: "sleep_record",
  healthKey: "sleep",
});

export const registerGetWeightHistoryTool = createRegisterHealthHistoryTool({
  name: "kaiord_get_weight_history",
  description:
    "List weight measurements from input files sorted by measuredAt ascending",
  inputNoun: "weight measurements",
  krdType: "weight_measurement",
  healthKey: "weight",
});

export const registerGetHrvHistoryTool = createRegisterHealthHistoryTool({
  name: "kaiord_get_hrv_history",
  description:
    "List HRV summaries from input files sorted by measuredAt ascending",
  inputNoun: "HRV summaries",
  krdType: "hrv_summary",
  healthKey: "hrv",
});
