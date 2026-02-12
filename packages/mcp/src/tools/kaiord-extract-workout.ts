import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { Logger } from "@kaiord/core";
import { z } from "zod";

import { extractWorkout } from "@kaiord/core";

import { formatSchema } from "../types/tool-schemas";
import { formatError, formatSuccess } from "../utils/error-formatter";
import { validateExclusiveInput } from "../utils/resolve-input";
import { convertToKrd } from "./convert-to-krd";

const extractWorkoutSchema = {
  input_file: z.string().optional().describe("Path to the fitness data file"),
  input_content: z
    .string()
    .optional()
    .describe("Inline content (text or base64 for binary)"),
  input_format: formatSchema
    .optional()
    .describe("Input format (auto-detected from extension)"),
};

export const registerExtractWorkoutTool = (
  server: McpServer,
  logger: Logger
): void => {
  server.tool(
    "kaiord_extract_workout",
    "Extract the structured workout from a fitness file as JSON",
    extractWorkoutSchema,
    async (args) => {
      try {
        validateExclusiveInput(args.input_file, args.input_content);
        const krd = await convertToKrd(
          args.input_file,
          args.input_content,
          args.input_format,
          logger
        );
        const workout = extractWorkout(krd);
        return formatSuccess(JSON.stringify(workout, null, 2));
      } catch (error) {
        return formatError(error);
      }
    }
  );
};
