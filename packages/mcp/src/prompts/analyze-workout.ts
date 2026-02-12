import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

const promptArgs = {
  file_path: z.string().describe("Path to the fitness file to analyze"),
};

export const registerAnalyzeWorkoutPrompt = (server: McpServer): void => {
  server.prompt(
    "analyze_workout",
    "Guide analysis of a structured workout file",
    promptArgs,
    (args) => ({
      messages: [
        {
          role: "user",
          content: {
            type: "text",
            text: [
              `Analyze the workout in the file at "${args.file_path}".`,
              "",
              "Steps:",
              "1. Use kaiord_inspect to get an overview of the file.",
              "2. Use kaiord_extract_workout to get the structured workout.",
              "3. Summarize: sport, total steps, intensity distribution,",
              "   duration breakdown, and target zones.",
              "4. Provide training recommendations if applicable.",
            ].join("\n"),
          },
        },
      ],
    })
  );
};
