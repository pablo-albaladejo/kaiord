import { validateKrd } from "@kaiord/core";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

import { formatError, formatSuccess } from "../utils/error-formatter";
import { resolveTextInput } from "../utils/resolve-input";
import { registerKaiordTool } from "./register-kaiord-tool";
import { REMOTE_ZWO_NOTE } from "./remote-notes";
import type { ToolContext } from "./tool-context";
import { admitKrd } from "./tool-context";

const DESCRIPTION = "Validate a KRD JSON document against the schema";

const validateSchema = {
  input_file: z.string().optional().describe("Path to KRD JSON file"),
  input_content: z.string().optional().describe("Inline KRD JSON content"),
};

export const registerValidateTool = (
  server: McpServer,
  context: ToolContext
): void => {
  const { logger, remote } = context;
  const description = remote ? DESCRIPTION + REMOTE_ZWO_NOTE : DESCRIPTION;
  const tool = { name: "kaiord_validate", description, shape: validateSchema };
  registerKaiordTool(server, { ...tool, remote }, async (args) => {
    try {
      logger.debug("Validating KRD document");
      const text = await resolveTextInput(args.input_file, args.input_content);
      const parsed = JSON.parse(text) as unknown;
      admitKrd(context, validateKrd(parsed));
      return formatSuccess("Valid KRD document.");
    } catch (error) {
      return formatError(error);
    }
  });
};
