type ExtensionResponse = {
  ok: boolean;
  protocolVersion?: number;
  data?: unknown;
  error?: string;
  status?: number;
};

export const sendMessage = (
  extensionId: string,
  message: unknown,
  timeoutMs: number
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
            (raw as ExtensionResponse) ?? { ok: false, error: "No response" }
          );
        }
      });
    } catch {
      clearTimeout(timer);
      resolve({ ok: false, error: "Extension not available" });
    }
  });

type PingData = { gcApi?: { ok: boolean } };

const PING_TIMEOUT_1 = 2_000;
const PING_TIMEOUT_2 = 4_000;

export const ping = async (
  extensionId: string
): Promise<ExtensionResponse & { data?: PingData }> => {
  const res = await sendMessage(
    extensionId,
    { action: "ping" },
    PING_TIMEOUT_1
  );
  if (res.ok) return res as ExtensionResponse & { data?: PingData };
  if (res.error === "Extension did not respond") {
    return (await sendMessage(
      extensionId,
      { action: "ping" },
      PING_TIMEOUT_2
    )) as ExtensionResponse & { data?: PingData };
  }
  return res as ExtensionResponse & { data?: PingData };
};
