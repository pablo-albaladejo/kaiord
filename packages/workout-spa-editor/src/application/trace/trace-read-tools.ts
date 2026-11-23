/**
 * Read Tools run inside the model's loop with no confirmation, so the run
 * learns of them here: each call is recorded in the Trace with its result,
 * never its input or output, and the kinds of data its answer handed the
 * Provider are counted (none for a health Tool the athlete withheld).
 * Action Tools are recorded where the athlete answers them.
 */
import type { ChatTool } from "@kaiord/ai";

import { chatToolKinds } from "../chat/tools/chat-tool-kinds";
import { HEALTH_WITHHELD } from "../chat/tools/withhold-health";
import type { DestinationId } from "../data-flows/destinations";
import type { TraceRun } from "./trace-run";

const traced = (
  tool: ChatTool,
  run: TraceRun,
  to: DestinationId
): ChatTool => ({
  ...tool,
  execute: async (input) => {
    let result: "ok" | "failed" = "failed";
    try {
      const output = await tool.execute(input);
      result = "ok";
      if (output !== HEALTH_WITHHELD)
        run.sent(to, chatToolKinds(tool.name, input));
      return output;
    } finally {
      run.tool({ name: tool.name, confirmation: "not_needed", result });
    }
  },
});

export const traceReadTools = (
  tools: readonly ChatTool[],
  run: TraceRun,
  to: DestinationId
): ChatTool[] =>
  tools.map((tool) =>
    tool.requiresConfirmation ? tool : traced(tool, run, to)
  );
