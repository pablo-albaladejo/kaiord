import type { ChatTool } from "@kaiord/ai";

/**
 * Runs an approved action tool's `execute`. A throw is converted into an
 * error result (not re-thrown) so the turn can resume and let the model
 * explain the failure to the user, per the "tool execution fails" scenario.
 */
export const runConfirmedTool = async (
  tools: ChatTool[],
  toolName: string,
  input: unknown
): Promise<{ output: unknown; ok: boolean }> => {
  const tool = tools.find((t) => t.name === toolName);
  if (!tool) return { output: { error: "unknown_tool" }, ok: false };
  try {
    return { output: await tool.execute(input), ok: true };
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return { output: { error: message }, ok: false };
  }
};
