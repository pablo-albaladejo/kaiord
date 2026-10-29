import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

import { formatSchema } from "../types/tool-schemas";
import { formatError, formatSuccess } from "../utils/error-formatter";
import { validateExclusiveInput } from "../utils/resolve-input";
import { convertFromKrd } from "./convert-from-krd";
import { registerKaiordTool } from "./register-kaiord-tool";
import { REMOTE_ZWO_NOTE } from "./remote-notes";
import type { ToolContext } from "./tool-context";
import { readAdmittedKrd } from "./tool-context";

const DESCRIPTION =
  "Convert between fitness data formats (FIT, TCX, ZWO, GCN, KRD). FIT output is returned as base64 text unless output_file is given.";

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
    .describe("Path to write output (FIT is returned as base64 when omitted)"),
  ftp: z
    .number()
    .positive()
    .optional()
    .describe(
      "Athlete FTP in watts. Required for GCN output when the workout has %FTP power targets (resolved to watts)"
    ),
};

export const registerConvertTool = (
  server: McpServer,
  context: ToolContext
): void => {
  const { logger, remote, fitWriter } = context;
  const description = remote ? DESCRIPTION + REMOTE_ZWO_NOTE : DESCRIPTION;
  const tool = { name: "kaiord_convert", description, shape: convertSchema };
  registerKaiordTool(server, { ...tool, remote }, async (args) => {
    try {
      validateExclusiveInput(args.input_file, args.input_content);
      const krd = await readAdmittedKrd(
        context,
        args.input_file,
        args.input_content,
        args.input_format
      );
      const result = await convertFromKrd(
        krd,
        args.output_format,
        args.output_file,
        { logger, ftpWatts: args.ftp, fitWriter }
      );
      const message = result.writtenTo
        ? `Converted to ${args.output_format}. Written to: ${result.writtenTo}\n\n${result.content}`
        : result.content;
      return formatSuccess(message);
    } catch (error) {
      return formatError(error);
    }
  });
};
