import type { ModelMessage } from "ai";
import type { AgentFileInput, GenerateAgentInput } from "./definition-types";
import { MAX_ERROR_LENGTH, truncate } from "./retry-policy";

type UserPart =
  | { type: "text"; text: string }
  | { type: "file"; data: Uint8Array; mediaType: string; filename?: string };

const toFilePart = (file: AgentFileInput): UserPart => ({
  type: "file",
  data: file.data,
  mediaType: file.mediaType,
  ...(file.filename ? { filename: file.filename } : {}),
});

const withFeedback = (text: string | undefined, feedback: string): string => {
  const note = `[Previous attempt failed: ${truncate(feedback, MAX_ERROR_LENGTH)}. Fix the errors.]`;
  return text ? `${text}\n\n${note}` : note;
};

/**
 * Builds a single user message from optional text and document attachments.
 * On a retry, the previous failure is appended to the text as feedback so the
 * model can self-correct. File parts carry raw bytes and media type verbatim.
 */
export const buildUserMessage = (
  input: GenerateAgentInput,
  feedback?: string
): ModelMessage => {
  const text = feedback ? withFeedback(input.text, feedback) : input.text;
  const parts: UserPart[] = [
    ...(text ? [{ type: "text" as const, text }] : []),
    ...(input.files ?? []).map(toFilePart),
  ];
  return { role: "user", content: parts } as ModelMessage;
};
