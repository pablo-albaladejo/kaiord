import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { Logger } from "@kaiord/core";
import { z } from "zod";

import { formatSchema } from "../types/tool-schemas";
import { formatError, formatSuccess } from "../utils/error-formatter";
import { convertToKrd } from "./convert-to-krd";
import { compareKrdFiles } from "./diff-compare";

const diffSchema = {
  file1: z.string().describe("Path to the first fitness data file"),
  file2: z.string().describe("Path to the second fitness data file"),
  format1: formatSchema
    .optional()
    .describe("Format of file1 (auto-detected from extension)"),
  format2: formatSchema
    .optional()
    .describe("Format of file2 (auto-detected from extension)"),
};

export const registerDiffTool = (server: McpServer, logger: Logger): void => {
  server.tool(
    "kaiord_diff",
    "Compare two fitness files and show differences",
    diffSchema,
    async (args) => {
      try {
        const [krd1, krd2] = await Promise.all([
          convertToKrd(args.file1, undefined, args.format1, logger),
          convertToKrd(args.file2, undefined, args.format2, logger),
        ]);
        const diff = compareKrdFiles(krd1, krd2);
        return formatSuccess(JSON.stringify(diff, null, 2));
      } catch (error) {
        return formatError(error);
      }
    }
  );
};
