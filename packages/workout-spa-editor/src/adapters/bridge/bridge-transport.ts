export type ExtensionResponse = {
  ok: boolean;
  protocolVersion?: number;
  data?: unknown;
  error?: string;
  status?: number;
  // Bridges surface a dead cookie session (e.g. tanita `read-export-csv` when
  // the mytanita.eu login expired) by setting this on the error envelope so the
  // SPA can prompt a re-login instead of retrying. Emitted by bridge-envelope.js.
  needsReauth?: boolean;
  /**
   * Did the message reach the extension at all? `false` only for a delivery
   * failure — not installed, no listener, timeout, no chrome runtime. An
   * extension that answered `ok: false` IS delivered: it is there, it just
   * said no. This is the only signal that separates "the extension is gone"
   * from "the upstream session is dead", and bridge discovery cannot supply
   * it — it only ever `.set()`s an id and never expires one.
   */
  delivered?: boolean;
};

const PING_TIMEOUT_MS = 3_000;

export const sendBridgeMessage = (
  extensionId: string,
  message: unknown,
  timeoutMs: number = PING_TIMEOUT_MS
): Promise<ExtensionResponse> =>
  new Promise((resolve) => {
    if (typeof chrome === "undefined" || !chrome.runtime?.sendMessage) {
      resolve({
        ok: false,
        delivered: false,
        error: "Chrome runtime not available",
      });
      return;
    }

    const timer = setTimeout(() => {
      resolve({
        ok: false,
        delivered: false,
        error: "Extension did not respond",
      });
    }, timeoutMs);

    try {
      chrome.runtime.sendMessage(extensionId, message, (raw) => {
        clearTimeout(timer);
        if (chrome.runtime.lastError) {
          resolve({
            ok: false,
            delivered: false,
            error: chrome.runtime.lastError.message,
          });
        } else {
          resolve(
            raw === undefined || raw === null
              ? { ok: false, delivered: false, error: "No response" }
              : { delivered: true, ...(raw as ExtensionResponse) }
          );
        }
      });
    } catch {
      clearTimeout(timer);
      resolve({
        ok: false,
        delivered: false,
        error: "Extension not available",
      });
    }
  });
