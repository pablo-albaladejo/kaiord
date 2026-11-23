/**
 * One read through the Train2Go Bridge, in whichever protocol it speaks.
 *
 * Protocol 2 (thin Bridge): `{ action: "request", method, path }` is
 * answered with Train2Go's raw answer, which `read` turns into data here.
 * Protocol 1 (the previous one, still accepted): the extension does not
 * know `request` and refuses it in a version-1 envelope, so the same read
 * is sent again as the legacy action, which the extension parses itself.
 * Every envelope carries `protocolVersion`; that is the only signal used.
 */
import { z } from "zod";

import type { ExtensionResponse } from "../../bridge/bridge-transport";

export const TRAIN2GO_PROTOCOL_VERSION = 2;
export const PREVIOUS_TRAIN2GO_PROTOCOL_VERSION = 1;

const rawAnswerSchema = z.object({
  status: z.number(),
  contentType: z.string(),
  body: z.string(),
});

export type RawAnswer = z.infer<typeof rawAnswerSchema>;

export type BridgeSend = (message: unknown) => Promise<ExtensionResponse>;

export type BridgeRead<T> = {
  path: string;
  legacy: Record<string, unknown>;
  read: (answer: RawAnswer) => T;
};

const speaksPreviousProtocol = (res: ExtensionResponse): boolean =>
  res.protocolVersion === PREVIOUS_TRAIN2GO_PROTOCOL_VERSION;

const malformed = (res: ExtensionResponse): ExtensionResponse => ({
  ok: false,
  delivered: res.delivered,
  protocolVersion: res.protocolVersion,
  error: "Malformed response body",
});

const readRaw = <T>(
  res: ExtensionResponse,
  read: (answer: RawAnswer) => T
): ExtensionResponse => {
  const answer = rawAnswerSchema.safeParse(res.data);
  if (!answer.success) return malformed(res);
  try {
    return { ...res, data: read(answer.data) };
  } catch {
    return malformed(res);
  }
};

export const readThroughBridge = async <T>(
  send: BridgeSend,
  { path, legacy, read }: BridgeRead<T>
): Promise<ExtensionResponse> => {
  const res = await send({ action: "request", method: "GET", path });
  if (speaksPreviousProtocol(res)) return send(legacy);
  if (!res.ok) return res;
  return readRaw(res, read);
};
