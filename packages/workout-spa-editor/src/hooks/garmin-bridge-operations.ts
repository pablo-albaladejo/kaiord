/**
 * Garmin Bridge Operations - Transport-level helpers for the bridge hook.
 */
import type { PushState } from "../contexts/garmin-bridge-types";
import { sendMessage } from "../store/garmin-extension-transport";

const PUSH_TIMEOUT = 15_000;
const LIST_TIMEOUT = 10_000;

export type PushResult =
  | { status: "success" }
  | { status: "error"; message: string; redetect: boolean }
  | { status: "invalidated" };

export async function executePush(
  extensionId: string,
  gcn: unknown
): Promise<PushResult> {
  const res = await sendMessage(
    extensionId,
    { action: "push", gcn },
    PUSH_TIMEOUT
  );

  if (res.error === "Extension context invalidated") {
    return { status: "invalidated" };
  }

  if (!res.ok) {
    const redetect = res.status === 401 || res.status === 403;
    const message =
      res.error === "Extension did not respond"
        ? "Extension did not respond. Check Garmin Connect before retrying."
        : (res.error ?? "Push failed");
    return { status: "error", message, redetect };
  }

  return { status: "success" };
}

export async function executeList(
  extensionId: string
): Promise<{ data: unknown[]; redetect: boolean }> {
  const res = await sendMessage(extensionId, { action: "list" }, LIST_TIMEOUT);

  if (res.error === "Extension context invalidated") {
    throw new Error("Extension was updated. Please try again.");
  }

  if (!res.ok) {
    const redetect = res.status === 401 || res.status === 403;
    if (redetect) {
      throw Object.assign(new Error(res.error ?? "List failed"), {
        redetect: true,
      });
    }
    throw new Error(res.error ?? "List failed");
  }

  return {
    data: Array.isArray(res.data) ? (res.data as unknown[]) : [],
    redetect: false,
  };
}

export type DetectionResult =
  | { installed: false }
  | { installed: true; session: false; error: string }
  | { installed: true; session: boolean; error: null };

const SUPPORTED_PROTOCOLS = [1];

export function evaluatePingResult(res: {
  ok: boolean;
  protocolVersion?: number;
  data?: unknown;
}): DetectionResult {
  if (!res.ok) return { installed: false };
  if (
    !res.protocolVersion ||
    !SUPPORTED_PROTOCOLS.includes(res.protocolVersion)
  )
    return {
      installed: true,
      session: false,
      error: "Update your Kaiord Garmin Bridge extension",
    };
  const data = res.data as { gcApi?: { ok: boolean } } | undefined;
  return {
    installed: true,
    session: data?.gcApi?.ok === true,
    error: null,
  };
}

export const INITIAL_PUSH_STATE: PushState = { status: "idle" };
