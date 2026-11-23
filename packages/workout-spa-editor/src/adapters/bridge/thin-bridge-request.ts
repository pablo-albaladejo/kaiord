/**
 * One call through a thin Bridge, in whichever protocol it speaks
 * (docs/adr/0004-thin-bridge-smart-connector.md).
 *
 * Protocol 2: `{ action: "request", method, path, body? }` is answered with
 * the Platform's raw answer, which `read` turns into data here. Protocol 1
 * (the previous one, still accepted): the extension does not know `request`
 * and refuses it in a version-1 envelope before sending anything, so the
 * same call is sent again as the legacy action, which the extension reads
 * itself. Every envelope carries `protocolVersion`; that is the only signal.
 */
import { z } from "zod";

import type { ExtensionResponse } from "./bridge-transport";

export const PREVIOUS_BRIDGE_PROTOCOL_VERSION = 1;
export const MALFORMED_ANSWER = "Malformed response body";

const rawAnswerSchema = z.object({
  status: z.number(),
  contentType: z.string(),
  body: z.string(),
});

export type RawAnswer = z.infer<typeof rawAnswerSchema>;

export type BridgeSend = (message: unknown) => Promise<ExtensionResponse>;

export type BridgeCall<T> = {
  method: "GET" | "POST" | "DELETE";
  path: string;
  body?: unknown;
  legacy: Record<string, unknown>;
  read: (answer: RawAnswer) => T;
};

type Refusal = { needsReauth?: boolean; status?: number; retryable?: boolean };

/** Thrown by a reader for an answer that says no (a login page, a payload
    that is not the expected shape); carried on the envelope as it is. */
export class BridgeAnswerRefusal extends Error {
  readonly refusal: Refusal;
  constructor(message: string, refusal: Refusal = {}) {
    super(message);
    this.name = "BridgeAnswerRefusal";
    this.refusal = refusal;
  }
}

export const speaksPreviousProtocol = (res: ExtensionResponse): boolean =>
  res.protocolVersion === PREVIOUS_BRIDGE_PROTOCOL_VERSION;

const failed = (
  res: ExtensionResponse,
  error: string,
  refusal: Refusal = {}
): ExtensionResponse => ({
  ok: false,
  delivered: res.delivered,
  protocolVersion: res.protocolVersion,
  error,
  ...refusal,
});

const readRaw = <T>(
  res: ExtensionResponse,
  read: (answer: RawAnswer) => T
): ExtensionResponse => {
  const answer = rawAnswerSchema.safeParse(res.data);
  if (!answer.success) return failed(res, MALFORMED_ANSWER);
  try {
    return { ...res, data: read(answer.data) };
  } catch (e) {
    return e instanceof BridgeAnswerRefusal
      ? failed(res, e.message, e.refusal)
      : failed(res, MALFORMED_ANSWER);
  }
};

const requestMessage = ({ method, path, body }: BridgeCall<unknown>) => ({
  action: "request",
  method,
  path,
  ...(body === undefined ? {} : { body }),
});

export const callThroughBridge = async <T>(
  send: BridgeSend,
  call: BridgeCall<T>
): Promise<ExtensionResponse> => {
  const res = await send(requestMessage(call));
  if (speaksPreviousProtocol(res)) return send(call.legacy);
  if (!res.ok) return res;
  return readRaw(res, call.read);
};
