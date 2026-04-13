/**
 * Train2Go Extension Transport
 *
 * Sends messages to the Train2Go Bridge Chrome extension
 * via chrome.runtime.sendMessage. Mirrors garmin-extension-transport.
 */

type ExtensionResponse = {
  ok: boolean;
  protocolVersion?: number;
  data?: unknown;
  error?: string;
  status?: number;
};

const sendMessage = (
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

type PingData = {
  sessionActive: boolean;
  userId?: number;
  userName?: string;
};

const PING_TIMEOUT_1 = 2_000;
const PING_TIMEOUT_2 = 4_000;
const ACTION_TIMEOUT = 15_000;

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

type Train2GoActivity = {
  id: number;
  date: string;
  sport: string;
  title: string;
  duration: string;
  workload: number;
  status: number;
  description?: string;
  completion?: number;
};

type ReadWeekData = { activities: Train2GoActivity[] };
type ReadDayData = { activities: Train2GoActivity[] };

export const readWeek = async (
  extensionId: string,
  date: string,
  userId: number
): Promise<ExtensionResponse & { data?: ReadWeekData }> =>
  sendMessage(
    extensionId,
    { action: "read-week", date, userId },
    ACTION_TIMEOUT
  ) as Promise<ExtensionResponse & { data?: ReadWeekData }>;

export const readDay = async (
  extensionId: string,
  date: string,
  userId: number
): Promise<ExtensionResponse & { data?: ReadDayData }> =>
  sendMessage(
    extensionId,
    { action: "read-day", date, userId },
    ACTION_TIMEOUT
  ) as Promise<ExtensionResponse & { data?: ReadDayData }>;

export const openTrain2Go = (extensionId: string): Promise<ExtensionResponse> =>
  sendMessage(extensionId, { action: "open-train2go" }, PING_TIMEOUT_1);
