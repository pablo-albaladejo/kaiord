/**
 * Model-facing only (never rendered): when a reply was stopped, names the
 * actions that already ran in its turn so the model does not offer them
 * again. Reads only `toolName` and the app-authored `content` that
 * `appendToolEvent` writes; tool result payloads never reach the model.
 */
import type { ChatMessageRecord } from "../../types/chat/chat-message-record";

const isFailedRow = (r: ChatMessageRecord): boolean =>
  r.content === `${r.toolName} failed.`;

const turnToolRows = (
  records: ChatMessageRecord[],
  index: number
): ChatMessageRecord[] => {
  const before = records.slice(0, index);
  const turnStart = before.map((r) => r.role).lastIndexOf("user") + 1;
  return before
    .slice(turnStart)
    .filter((r) => r.role === "tool" && Boolean(r.toolName));
};

const names = (rows: ChatMessageRecord[]): string =>
  rows.map((r) => r.toolName).join(", ");

export const stoppedTurnActionsNote = (
  records: ChatMessageRecord[],
  index: number
): string | undefined => {
  const rows = turnToolRows(records, index);
  const ran = rows.filter((r) => !isFailedRow(r));
  const failed = rows.filter(isFailedRow);
  const notes = [
    ran.length > 0 &&
      `(Already done before stopping: ${names(ran)}. Do not run ${ran.length > 1 ? "them" : "it"} again unless asked.)`,
    failed.length > 0 && `(Failed before stopping: ${names(failed)}.)`,
  ].filter((n): n is string => typeof n === "string");
  return notes.length > 0 ? notes.join("\n") : undefined;
};
