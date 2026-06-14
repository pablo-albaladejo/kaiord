import type { ChatTool } from "./chat-types";

/** Structured result returned when a tool's input fails schema validation. */
export type ToolInputError = {
  error: "invalid_input";
  message: string;
};

/**
 * Wraps a read tool's `execute` with a zod guard so malformed model input is
 * never passed to the implementation. On failure the validation error is
 * returned as the tool result (not thrown) so the model can self-correct
 * within the step budget; on success the parsed value is forwarded.
 */
export const wrapToolExecute =
  (tool: ChatTool) =>
  async (input: unknown): Promise<unknown> => {
    const parsed = tool.inputSchema.safeParse(input);
    if (!parsed.success) {
      const issue = parsed.error.issues[0];
      const where = issue?.path.join(".") || "input";
      const message = issue ? `${where}: ${issue.message}` : "Invalid input";
      return { error: "invalid_input", message } satisfies ToolInputError;
    }
    return tool.execute(parsed.data);
  };
