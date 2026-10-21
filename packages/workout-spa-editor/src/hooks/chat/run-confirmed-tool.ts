import type { ChatTool } from "@kaiord/ai";
import { ZodError } from "zod";

import { scrubAnalyticsString } from "../../lib/scrub-analytics-string";
import { logger } from "../../utils/logger";

/** App-authored codes the model reads when an approved action fails. Stable
 * snake_case keys, so a UI can word them per locale. */
export type ConfirmedToolErrorCode =
  "unknown_tool" | "invalid_input" | "action_failed";

const MAX_LOGGED_MESSAGE = 200;

const errorCodeOf = (error: unknown): ConfirmedToolErrorCode =>
  error instanceof ZodError ? "invalid_input" : "action_failed";

const logFailure = (toolName: string, error: unknown): void =>
  logger.error("[chat-action] failed", {
    toolName,
    name: error instanceof Error ? error.name : typeof error,
    message: scrubAnalyticsString(
      error instanceof Error ? error.message : String(error),
      MAX_LOGGED_MESSAGE
    ),
  });

/**
 * Runs an approved action tool's `execute`. A throw is converted into an
 * error result (not re-thrown) so the turn can resume and let the model
 * explain the failure to the user, per the "tool execution fails" scenario.
 * The model receives an app error code, never the exception's text: that
 * text can come from a bridge, a provider or a parsed file. The cause is
 * logged, scrubbed and bounded, so the failure stays diagnosable.
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
  } catch (error) {
    logFailure(toolName, error);
    return { output: { error: errorCodeOf(error) }, ok: false };
  }
};
