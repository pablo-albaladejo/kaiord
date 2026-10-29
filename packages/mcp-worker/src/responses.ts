const HTTP_BAD_REQUEST = 400;
const HTTP_NOT_FOUND = 404;
const HTTP_METHOD_NOT_ALLOWED = 405;
const HTTP_PAYLOAD_TOO_LARGE = 413;
const HTTP_TOO_MANY_REQUESTS = 429;
const HTTP_INTERNAL_ERROR = 500;

const PARSE_ERROR = -32700;
const INVALID_REQUEST = -32600;
const SERVER_ERROR = -32000;
const INTERNAL_ERROR = -32603;

const jsonRpcError = (
  status: number,
  code: number,
  message: string,
  headers: Record<string, string> = {}
): Response =>
  new Response(
    JSON.stringify({ jsonrpc: "2.0", error: { code, message }, id: null }),
    { status, headers: { "content-type": "application/json", ...headers } }
  );

export const notFound = (): Response =>
  new Response("Not Found", { status: HTTP_NOT_FOUND });

export const methodNotAllowed = (): Response =>
  jsonRpcError(
    HTTP_METHOD_NOT_ALLOWED,
    SERVER_ERROR,
    "Method not allowed: this endpoint accepts POST only",
    { allow: "POST" }
  );

export const payloadTooLarge = (maxBytes: number): Response =>
  jsonRpcError(
    HTTP_PAYLOAD_TOO_LARGE,
    SERVER_ERROR,
    `Request body exceeds ${maxBytes} bytes`
  );

export const tooManyRequests = (): Response =>
  jsonRpcError(HTTP_TOO_MANY_REQUESTS, SERVER_ERROR, "Too many requests");

export const parseError = (): Response =>
  jsonRpcError(HTTP_BAD_REQUEST, PARSE_ERROR, "Parse error: invalid JSON");

export const invalidRequest = (message: string): Response =>
  jsonRpcError(HTTP_BAD_REQUEST, INVALID_REQUEST, message);

export const internalError = (): Response =>
  jsonRpcError(HTTP_INTERNAL_ERROR, INTERNAL_ERROR, "Internal error");
