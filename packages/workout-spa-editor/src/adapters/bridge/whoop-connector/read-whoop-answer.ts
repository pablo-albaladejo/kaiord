/**
 * Reading WHOOP's raw answers, which the WHOOP Bridge hands over unread:
 * the JSON body, or a body that is not JSON cut to its first 500 characters
 * (as the extension's content script used to). A refusal WHOOP itself made
 * (a status) reaches the sync as `{ ok: false, status }`, the shape it read
 * before; a failure with no status (no tab, no captured Session, a timeout)
 * stays a failed message.
 */
import type { WhoopFetchResult } from "../../../application/whoop/whoop-fetch-result";
import type { ExtensionResponse } from "../bridge-transport";
import type { RawAnswer } from "../thin-bridge-request";
import { speaksPreviousProtocol } from "../thin-bridge-request";

const BODY_CAP = 500;

const parseBody = (body: string): unknown => {
  if (body === "") return null;
  try {
    return JSON.parse(body) as unknown;
  } catch {
    return body.slice(0, BODY_CAP);
  }
};

export const readWhoopAnswer = (answer: RawAnswer): WhoopFetchResult => ({
  ok: true,
  status: answer.status,
  data: parseBody(answer.body),
});

export const whoopRefusal = (
  res: ExtensionResponse
): WhoopFetchResult | null =>
  !res.ok && !speaksPreviousProtocol(res) && typeof res.status === "number"
    ? { ok: false, status: res.status }
    : null;
