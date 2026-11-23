/**
 * Read Tools run inside the model's loop with no confirmation, so the run
 * learns of them here: each call is recorded in the Trace with its result,
 * never its input or output. Action Tools are recorded where the athlete
 * answers them.
 */
import type { ChatTool } from "@kaiord/ai";

import type { TraceRun } from "./trace-run";

const traced = (tool: ChatTool, run: TraceRun): ChatTool => ({
  ...tool,
  execute: async (input) => {
    let result: "ok" | "failed" = "failed";
    try {
      const output = await tool.execute(input);
      result = "ok";
      return output;
    } finally {
      run.tool({ name: tool.name, confirmation: "not_needed", result });
    }
  },
});

export const traceReadTools = (
  tools: readonly ChatTool[],
  run: TraceRun
): ChatTool[] =>
  tools.map((tool) => (tool.requiresConfirmation ? tool : traced(tool, run)));
