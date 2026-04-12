/**
 * Bridge Transport
 *
 * Sends messages to Chrome extensions via chrome.runtime.sendMessage.
 * Extracted from garmin-extension-transport for reuse.
 */

type ExtensionResponse = {
  ok: boolean;
  protocolVersion?: number;
  data?: unknown;
  error?: string;
  status?: number;
};

const PING_TIMEOUT_MS = 3_000;

export const sendBridgeMessage = (
  extensionId: string,
  message: unknown,
  timeoutMs: number = PING_TIMEOUT_MS
): Promise<ExtensionResponse> =>
  new Promise((resolve) => {
    if (typeof chrome === "undefined" || !chrome.runtime?.sendMessage) {
      resolve({ ok: false, error: "Chrome runtime not available" });
      return;
    }

    const timer = setTimeout(() => {
      resolve({ ok: false, error: "Extension did not respond" });
    }, timeoutMs);

    try {
      chrome.runtime.sendMessage(extensionId, message, (raw) => {
        clearTimeout(timer);
        if (chrome.runtime.lastError) {
          resolve({ ok: false, error: chrome.runtime.lastError.message });
        } else {
          resolve(
            (raw as ExtensionResponse) ?? {
              ok: false,
              error: "No response",
            }
          );
        }
      });
    } catch {
      clearTimeout(timer);
      resolve({ ok: false, error: "Extension not available" });
    }
  });
