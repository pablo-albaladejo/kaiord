import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { Logger } from "@kaiord/core";
import { z } from "zod";

import { validateKrd } from "@kaiord/core";

import { formatError, formatSuccess } from "../utils/error-formatter";
import { resolveTextInput } from "../utils/resolve-input";

const validateSchema = {
  input_file: z.string().optional().describe("Path to KRD JSON file"),
  input_content: z.string().optional().describe("Inline KRD JSON content"),
};

export const registerValidateTool = (
  server: McpServer,
  logger: Logger
): void => {
  server.tool(
    "kaiord_validate",
    "Validate a KRD JSON document against the schema",
    validateSchema,
    async (args) => {
      try {
        logger.debug("Validating KRD document");
        const text = await resolveTextInput(
          args.input_file,
          args.input_content
        );
        const parsed = JSON.parse(text) as unknown;
        validateKrd(parsed);
        return formatSuccess("Valid KRD document.");
      } catch (error) {
        return formatError(error);
      }
    }
  );
};
