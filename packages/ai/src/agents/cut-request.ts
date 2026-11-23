import type { ModelMessage } from "ai";

import type {
  AiRequest,
  AiRequestOutcome,
  AiUsage,
} from "../observability/telemetry-types";
import { estimateTokens } from "../providers/pricing/estimate-tokens";

type Part = Record<string, unknown>;

// A document or image is billed by the Provider's own rule, not by
// characters; its bytes are left out, so the estimate is of the text only.
const partChars = (part: Part): number => {
  if (part.type === "file" || part.type === "image") return 0;
  if (typeof part.text === "string") return part.text.length;
  return JSON.stringify(part).length;
};

const messageChars = (message: ModelMessage): number =>
  typeof message.content === "string"
    ? message.content.length
    : (message.content as Part[]).reduce((n, p) => n + partChars(p), 0);

/** Characters of text a request carries: the system prompt and messages. */
export const requestChars = (
  system: string | undefined,
  messages: readonly ModelMessage[]
): number =>
  (system?.length ?? 0) +
  messages.reduce((n, m) => n + messageChars(m), 0);

/** Characters of output a stream part carries (text, reasoning, tool input). */
export const streamedChars = (part: object): number => {
  if ("text" in part && typeof part.text === "string") return part.text.length;
  if ("delta" in part && typeof part.delta === "string")
    return part.delta.length;
  return 0;
};

/** The estimated usage of a request cut before the Provider reported it. */
export const cutUsage = (sentChars: number, receivedChars: number): AiUsage => ({
  promptTokens: estimateTokens(sentChars),
  completionTokens: estimateTokens(receivedChars),
});

/**
 * A request cut before the Provider reported its usage (a Stop, the
 * watchdog, a dropped stream). The Provider bills it all the same and the
 * SDK reports usage only with the final chunk, so it is estimated from the
 * request's text and the output streamed before the cut, and marked so.
 */
export const cutRequest = (
  outcome: AiRequestOutcome,
  sentChars: number,
  receivedChars: number
): AiRequest => ({
  outcome,
  estimated: true,
  usage: cutUsage(sentChars, receivedChars),
});
