import { extractWorkout } from "@kaiord/core";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

import { formatSchema } from "../types/tool-schemas";
import { formatError, formatSuccess } from "../utils/error-formatter";
import { validateExclusiveInput } from "../utils/resolve-input";
import { registerKaiordTool } from "./register-kaiord-tool";
import type { ToolContext } from "./tool-context";
import { readAdmittedKrd } from "./tool-context";

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
  context: ToolContext
): void => {
  const tool = {
    name: "kaiord_extract_workout",
    description: "Extract the structured workout from a fitness file as JSON",
    shape: extractWorkoutSchema,
    remote: context.remote,
  };
  registerKaiordTool(server, tool, async (args) => {
    try {
      validateExclusiveInput(args.input_file, args.input_content);
      const krd = await readAdmittedKrd(
        context,
        args.input_file,
        args.input_content,
        args.input_format
      );
      const workout = extractWorkout(krd);
      return formatSuccess(JSON.stringify(workout, null, 2));
    } catch (error) {
      return formatError(error);
    }
  });
};
