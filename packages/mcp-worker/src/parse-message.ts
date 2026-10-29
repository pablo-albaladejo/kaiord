import { invalidRequest, parseError } from "./responses";

export type JsonRpcMessage = Record<string, unknown>;

export type ParsedMessage =
  | { readonly ok: true; readonly message: JsonRpcMessage }
  | { readonly ok: false; readonly response: Response };

const decoder = new TextDecoder();

/**
 * One call per request (D6): the transport would run a JSON-RPC batch of up
 * to 100 messages, turning one rate-limited request into 100 tool calls.
 */
export const parseMessage = (body: Uint8Array): ParsedMessage => {
  let value: unknown;
  try {
    value = JSON.parse(decoder.decode(body));
  } catch {
    return { ok: false, response: parseError() };
  }
  if (Array.isArray(value)) {
    return {
      ok: false,
      response: invalidRequest("Batch requests are not accepted"),
    };
  }
  if (typeof value !== "object" || value === null) {
    return {
      ok: false,
      response: invalidRequest("Request must be a JSON-RPC object"),
    };
  }
  return { ok: true, message: value as JsonRpcMessage };
};
