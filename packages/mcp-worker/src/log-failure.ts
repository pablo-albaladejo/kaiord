import type { Log } from "./content-free-log";
import { safeLabel, safeMethod, safeToolName } from "./content-free-log";
import type { JsonRpcMessage } from "./parse-message";

type JsonRpcReply = {
  readonly result?: {
    readonly isError?: boolean;
    readonly structuredContent?: {
      readonly error?: { readonly type?: unknown };
    };
  };
  readonly error?: { readonly code?: unknown };
};

const TOOL_ERROR = "tool_error";

const readReply = async (response: Response): Promise<JsonRpcReply | null> => {
  const type = response.headers.get("content-type") ?? "";
  if (!type.includes("application/json")) return null;
  try {
    return (await response.clone().json()) as JsonRpcReply;
  } catch {
    return null;
  }
};

const toolOf = (message: JsonRpcMessage): string | undefined => {
  if (message.method !== "tools/call") return undefined;
  const params = message.params as { name?: unknown } | undefined;
  return safeToolName(params?.name);
};

/**
 * Reads the reply only for its failure markers: whether a tool reported an
 * error, its classification type, or a JSON-RPC error code. Nothing else of
 * the reply, and nothing of the request but its method and tool name, is
 * written.
 */
export const logFailure = async (
  message: JsonRpcMessage,
  response: Response,
  log: Log
): Promise<void> => {
  const reply = await readReply(response);
  if (reply === null) return;
  const method = safeMethod(message.method);
  const tool = toolOf(message);
  if (reply.result?.isError === true) {
    const type = reply.result.structuredContent?.error?.type;
    const errorClass = type === undefined ? TOOL_ERROR : safeLabel(type);
    log({ event: "tool_error", method, tool, errorClass });
  } else if (reply.error !== undefined) {
    const code = Number.isInteger(reply.error.code) ? reply.error.code : "";
    log({ event: "rpc_error", method, tool, errorClass: `jsonrpc${code}` });
  }
};
