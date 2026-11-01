import type { HandlerDeps } from "../deps";
import { dispatchMcp } from "../dispatch-mcp";
import { INTERNAL_ERROR, INVALID_PARAMS } from "./json-rpc";
import type { Part } from "./task";

type ToolReply = {
  readonly result?: {
    readonly isError?: boolean;
    readonly content?: ReadonlyArray<{ type?: unknown; text?: unknown }>;
  };
  readonly error?: unknown;
};

export type ToolOutcome =
  | { readonly ok: true; readonly failed: boolean; readonly parts: Part[] }
  | { readonly ok: false; readonly code: number };

const HTTP_OK = 200;

const readReply = async (response: Response): Promise<ToolReply | null> => {
  const type = response.headers.get("content-type") ?? "";
  if (response.status !== HTTP_OK || !type.includes("application/json")) {
    return null;
  }
  try {
    return (await response.json()) as ToolReply;
  } catch {
    return null;
  }
};

// Every remote tool answers with text content only (formatSuccess and
// formatError in @kaiord/mcp), so text items are the whole reply.
const textParts = (reply: ToolReply): Part[] =>
  (reply.result?.content ?? [])
    .filter((item) => typeof item.text === "string")
    .map((item) => ({ text: item.text, mediaType: "text/plain" }));

/**
 * D6: (a) a 200 result becomes a completed or failed task; (b) a non-200 or
 * non-JSON reply is an internal error; (c) a 200 JSON-RPC error is invalid
 * params. The SDK turns tool errors into isError results and skill ids are
 * checked before dispatch, so (c) is reachable only through an injected
 * server.
 */
export const callTool = async (
  skill: string,
  args: Record<string, unknown>,
  deps: HandlerDeps
): Promise<ToolOutcome> => {
  const message = {
    jsonrpc: "2.0",
    id: 1,
    method: "tools/call",
    params: { name: skill, arguments: args },
  };
  const reply = await readReply(await dispatchMcp(message, deps));
  if (reply === null) return { ok: false, code: INTERNAL_ERROR };
  if (reply.result === undefined) return { ok: false, code: INVALID_PARAMS };
  return {
    ok: true,
    failed: reply.result.isError === true,
    parts: textParts(reply),
  };
};
