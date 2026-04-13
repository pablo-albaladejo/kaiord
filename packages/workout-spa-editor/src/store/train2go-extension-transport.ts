/**
 * Train2Go Extension Transport
 *
 * Sends messages to the Train2Go Bridge Chrome extension
 * via chrome.runtime.sendMessage. Mirrors garmin-extension-transport.
 */

import type { Train2GoActivity } from "./train2go-store";

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

type PingData = { sessionActive: boolean; userId?: number; userName?: string };
type ReadData = { activities: Train2GoActivity[] };

const PING_T1 = 2_000;
const PING_T2 = 4_000;
const ACTION_T = 15_000;

export const ping = async (
  extensionId: string
): Promise<ExtensionResponse & { data?: PingData }> => {
  const res = await sendMessage(extensionId, { action: "ping" }, PING_T1);
  if (res.ok) return res as ExtensionResponse & { data?: PingData };
  if (res.error === "Extension did not respond") {
    return (await sendMessage(
      extensionId,
      { action: "ping" },
      PING_T2
    )) as ExtensionResponse & { data?: PingData };
  }
  return res as ExtensionResponse & { data?: PingData };
};

export const readWeek = (
  extensionId: string,
  date: string,
  userId: number
): Promise<ExtensionResponse & { data?: ReadData }> =>
  sendMessage(
    extensionId,
    { action: "read-week", date, userId },
    ACTION_T
  ) as Promise<ExtensionResponse & { data?: ReadData }>;

export const readDay = (
  extensionId: string,
  date: string,
  userId: number
): Promise<ExtensionResponse & { data?: ReadData }> =>
  sendMessage(
    extensionId,
    { action: "read-day", date, userId },
    ACTION_T
  ) as Promise<ExtensionResponse & { data?: ReadData }>;

export const openTrain2Go = (extensionId: string): Promise<ExtensionResponse> =>
  sendMessage(extensionId, { action: "open-train2go" }, PING_T1);
