import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { Logger } from "@kaiord/core";
import { z } from "zod";

import { formatSchema } from "../types/tool-schemas";
import { formatError, formatSuccess } from "../utils/error-formatter";
import { buildInspectSummary } from "./build-inspect-summary";
import { convertToKrd } from "./convert-to-krd";

const inspectSchema = {
  input_file: z.string().describe("Path to the fitness data file"),
  input_format: formatSchema
    .optional()
    .describe("Input format (auto-detected from extension)"),
};

export const registerInspectTool = (
  server: McpServer,
  logger: Logger
): void => {
  server.tool(
    "kaiord_inspect",
    "Inspect a fitness file and return a human-readable summary",
    inspectSchema,
    async (args) => {
      try {
        const krd = await convertToKrd(
          args.input_file,
          undefined,
          args.input_format,
          logger
        );
        return formatSuccess(buildInspectSummary(krd));
      } catch (error) {
        return formatError(error);
      }
    }
  );
};
