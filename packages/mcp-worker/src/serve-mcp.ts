import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { WebStandardStreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js";

import { buildServer } from "./build-server";
import { errorClassOf, safeMethod, writeLog } from "./content-free-log";
import type { HandlerDeps } from "./deps";
import { MAX_BODY_BYTES } from "./limits";
import { logFailure } from "./log-failure";
import type { JsonRpcMessage } from "./parse-message";
import { internalError } from "./responses";

const createTransport = () =>
  new WebStandardStreamableHTTPServerTransport({
    sessionIdGenerator: undefined,
    enableJsonResponse: true,
    // Not applied once parsedBody is passed; kept as a second bound.
    maxRequestBodySize: MAX_BODY_BYTES,
  });

/**
 * D6: a new server and a stateless transport (no session id, JSON replies)
 * for every request, so no state survives from one request to the next.
 */
export const serveMcp = async (
  request: Request,
  message: JsonRpcMessage,
  deps: HandlerDeps
): Promise<Response> => {
  const log = deps.log ?? writeLog;
  let server: McpServer | undefined;
  try {
    server = (deps.buildServer ?? buildServer)();
    const transport = createTransport();
    await server.connect(transport);
    const response = await transport.handleRequest(request, {
      parsedBody: message,
    });
    await logFailure(message, response, log);
    return response;
  } catch (error) {
    const method = safeMethod(message.method);
    log({ event: "request_error", method, errorClass: errorClassOf(error) });
    return internalError();
  } finally {
    await server?.close();
  }
};
