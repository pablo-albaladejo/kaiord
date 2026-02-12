import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { Logger } from "@kaiord/core";
import { z } from "zod";

import { formatSchema } from "../types/tool-schemas";
import { formatError, formatSuccess } from "../utils/error-formatter";
import { validateExclusiveInput } from "../utils/resolve-input";
import { convertFromKrd } from "./convert-from-krd";
import { convertToKrd } from "./convert-to-krd";

const convertSchema = {
  input_file: z.string().optional().describe("Path to input file"),
  input_content: z
    .string()
    .optional()
    .describe("Inline content (text or base64 for binary)"),
  input_format: formatSchema
    .optional()
    .describe("Input format (auto-detected from extension)"),
  output_format: formatSchema.describe("Target output format"),
  output_file: z
    .string()
    .optional()
    .describe("Path to write output (required for FIT)"),
};

export const registerConvertTool = (
  server: McpServer,
  logger: Logger
): void => {
  server.tool(
    "kaiord_convert",
    "Convert between fitness data formats (FIT, TCX, ZWO, GCN, KRD)",
    convertSchema,
    async (args) => {
      try {
        validateExclusiveInput(args.input_file, args.input_content);
        const krd = await convertToKrd(
          args.input_file,
          args.input_content,
          args.input_format,
          logger
        );
        const result = await convertFromKrd(
          krd,
          args.output_format,
          args.output_file,
          logger
        );
        const message = result.writtenTo
          ? `Converted to ${args.output_format}. Written to: ${result.writtenTo}\n\n${result.content}`
          : result.content;
        return formatSuccess(message);
      } catch (error) {
        return formatError(error);
      }
    }
  );
};
