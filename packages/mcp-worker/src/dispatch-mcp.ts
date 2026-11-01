import type { HandlerDeps } from "./deps";
import type { JsonRpcMessage } from "./parse-message";
import { serveMcp } from "./serve-mcp";

const INTERNAL_URL = "https://kaiord.com/mcp";

/**
 * D2: runs one MCP message on a fresh request that carries none of the
 * caller's headers, so an A2A client's `Accept` never reaches the transport.
 */
export const dispatchMcp = (
  message: JsonRpcMessage,
  deps: HandlerDeps
): Promise<Response> => {
  const request = new Request(INTERNAL_URL, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      accept: "application/json, text/event-stream",
    },
    body: JSON.stringify(message),
  });
  return serveMcp(request, message, deps);
};
