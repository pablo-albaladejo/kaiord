import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

import { formatSchema } from "../types/tool-schemas";
import { formatError, formatSuccess } from "../utils/error-formatter";
import { validateExclusiveInput } from "../utils/resolve-input";
import { compareKrdFiles } from "./diff-compare";
import { registerKaiordTool } from "./register-kaiord-tool";
import type { ToolContext } from "./tool-context";
import { readAdmittedKrd } from "./tool-context";

const inlineDescription = (side: string) =>
  `Inline content of the ${side} input (text or base64 for binary)`;

const diffSchema = {
  file1: z.string().optional().describe("Path to the first fitness data file"),
  file2: z.string().optional().describe("Path to the second fitness data file"),
  content1: z.string().optional().describe(inlineDescription("first")),
  content2: z.string().optional().describe(inlineDescription("second")),
  format1: formatSchema
    .optional()
    .describe("Format of the first input (auto-detected from file1)"),
  format2: formatSchema
    .optional()
    .describe("Format of the second input (auto-detected from file2)"),
};

export const registerDiffTool = (
  server: McpServer,
  context: ToolContext
): void => {
  const tool = {
    name: "kaiord_diff",
    description: "Compare two fitness files and show differences",
    shape: diffSchema,
    remote: context.remote,
  };
  registerKaiordTool(server, tool, async (args) => {
    try {
      validateExclusiveInput(args.file1, args.content1, ["file1", "content1"]);
      validateExclusiveInput(args.file2, args.content2, ["file2", "content2"]);
      const [krd1, krd2] = await Promise.all([
        readAdmittedKrd(context, args.file1, args.content1, args.format1),
        readAdmittedKrd(context, args.file2, args.content2, args.format2),
      ]);
      const diff = compareKrdFiles(krd1, krd2);
      return formatSuccess(JSON.stringify(diff, null, 2));
    } catch (error) {
      return formatError(error);
    }
  });
};
