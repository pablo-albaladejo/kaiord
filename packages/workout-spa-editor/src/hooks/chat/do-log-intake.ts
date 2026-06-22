/**
 * doLogIntake — chat action-op implementation for the `log_intake` tool.
 * Wraps the `logIntakeEntry` use case (validation + persistence) and maps its
 * result into a compact, PII-free confirmation payload for the chat turn.
 */
import type { LogIntakeInput } from "../../application/chat/tools/chat-tool-deps";
import { logIntakeEntry } from "../../application/nutrition/log-intake-entry.use-case";
import type { PersistencePort } from "../../ports/persistence-port";

export const doLogIntake = async (
  persistence: PersistencePort,
  profileId: string,
  input: LogIntakeInput
): Promise<unknown> => {
  const entry = await logIntakeEntry({ persistence, profileId }, input);
  if (!entry) return { error: "invalid_value" };
  return { id: entry.id, date: entry.date };
};
