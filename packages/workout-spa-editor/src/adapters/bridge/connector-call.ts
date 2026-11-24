/**
 * The one call every Connector (Garmin, Tanita, Train2Go, TrainingPeaks,
 * WHOOP) makes through its Bridge: each leg sent with the call's timeout
 * (`callThroughBridge`: the request, or the legacy action on the previous
 * protocol), JSON answers read one way, a failed envelope turned into the
 * error the Connector throws, and the one re-detect rule.
 */
import { type ExtensionResponse, sendBridgeMessage } from "./bridge-transport";
import {
  type BridgeCall,
  callThroughBridge,
  type RawAnswer,
} from "./thin-bridge-request";

export type ConnectorSend = (
  extensionId: string,
  message: unknown,
  timeoutMs: number
) => Promise<ExtensionResponse>;

export const callConnector = <T>(
  extensionId: string,
  call: BridgeCall<T>,
  timeoutMs: number,
  send: ConnectorSend = sendBridgeMessage
): Promise<ExtensionResponse> =>
  callThroughBridge((message) => send(extensionId, message, timeoutMs), call);

export const readJson = (answer: RawAnswer): unknown =>
  answer.body === "" ? null : (JSON.parse(answer.body) as unknown);

/** A 401/403 re-runs detection. It never says by itself that the Session
    ended: only the extension's `needsReauth` does. */
export const asksRedetect = (res: ExtensionResponse): boolean =>
  res.status === 401 || res.status === 403;

/** What a failed envelope says, for the Connector's own error. */
export type ConnectorFailure = {
  readonly message: string;
  readonly needsReauth: boolean;
  /** False when the extension never answered: it is gone, not signed out. */
  readonly delivered: boolean;
  readonly status: number | undefined;
  readonly redetect: boolean;
};

const failureOf = (
  res: ExtensionResponse,
  fallback: string
): ConnectorFailure => ({
  message: res.error ?? fallback,
  needsReauth: res.needsReauth === true,
  delivered: res.delivered !== false,
  status: res.status,
  redetect: asksRedetect(res),
});

/** The answer when it worked; otherwise the Connector's error is thrown. */
export const answerOrThrow = (
  res: ExtensionResponse,
  fallback: string,
  toError: (failure: ConnectorFailure) => Error
): ExtensionResponse => {
  if (!res.ok) throw toError(failureOf(res, fallback));
  return res;
};
