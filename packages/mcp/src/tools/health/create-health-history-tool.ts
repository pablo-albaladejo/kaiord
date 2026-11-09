import type { Logger } from "@kaiord/core";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

import { formatError, formatSuccess } from "../../utils/error-formatter";
import {
  type HealthKrdType,
  pickHealthByType,
  sortByHealthDate,
} from "./health-record-filters";
import { parseHealthRecords } from "./parse-health-records";

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

export const createRegisterHealthHistoryTool =
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
        const entries = sortByHealthDate(pickHealthByType(krds, spec.krdType))
          .map(
            (k) =>
              (k.extensions?.health as Record<string, unknown> | undefined)?.[
                spec.healthKey
              ]
          )
          .filter((v): v is Record<string, unknown> => v !== undefined);
        const total = entries.length;
        const records =
          args.limit !== undefined ? entries.slice(-args.limit) : entries;
        return formatSuccess(JSON.stringify({ records, total, skipped }));
      } catch (error) {
        return formatError(error);
      }
    });
  };
