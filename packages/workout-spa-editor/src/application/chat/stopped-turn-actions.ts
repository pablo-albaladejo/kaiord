/**
 * Model-facing only (never rendered): when a reply was stopped, names the
 * actions that already ran in its turn so the model does not offer them
 * again. Reads only `toolName` (the model's own tool call) and the content
 * `appendToolEvent` writes; tool result payloads never reach the model.
 */
import type { ChatMessageRecord } from "../../types/chat/chat-message-record";
import { isFailedToolEvent } from "./tool-event-content";

const isFailedRow = (r: ChatMessageRecord): boolean =>
  isFailedToolEvent(r.toolName ?? "", r.content);

// The turn starts after the last non-tool row, so actions an earlier reply
// already reported are not named again.
const turnToolRows = (
  records: ChatMessageRecord[],
  index: number
): ChatMessageRecord[] => {
  const before = records.slice(0, index);
  const turnStart = before.map((r) => r.role !== "tool").lastIndexOf(true) + 1;
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
