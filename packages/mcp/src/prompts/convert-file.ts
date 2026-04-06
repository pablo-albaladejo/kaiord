import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

import { formatSchema } from "../types/tool-schemas";

const promptArgs = {
  file_path: z.string().describe("Path to the fitness file to convert"),
  target_format: formatSchema.describe("Target output format"),
};

export const registerConvertFilePrompt = (server: McpServer): void => {
  server.prompt(
    "convert_file",
    "Guide conversion of a fitness file to another format",
    promptArgs,
    (args) => ({
      messages: [
        {
          role: "user",
          content: {
            type: "text",
            text: [
              `Convert the fitness file at "${args.file_path}" to ${args.target_format} format.`,
              "",
              "Steps:",
              "1. Use kaiord_inspect to examine the file first.",
              "2. Use kaiord_convert with the file path and target format.",
              "3. Report the result and any issues.",
            ].join("\n"),
          },
        },
      ],
    })
  );
};
