/**
 * Train2Go sendMessage helper.
 *
 * Promise-wraps chrome.runtime.sendMessage with a timeout. Extracted from
 * train2go-extension-transport.ts to keep that file under the lint limit.
 */

export type Train2GoExtensionResponse = {
  ok: boolean;
  protocolVersion?: number;
  data?: unknown;
  error?: string;
  status?: number;
};

export const train2goSendMessage = (
  extensionId: string,
  message: unknown,
  timeoutMs: number
): Promise<Train2GoExtensionResponse> =>
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
            (raw as Train2GoExtensionResponse) ?? {
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
