/**
 * Train2Go ping result shape + boundary stringification.
 *
 * Extracted from train2go-extension-transport.ts to keep that file
 * under the lint-enforced size limit. Stringifies platform user ids at
 * the SPA-side JSON boundary so detection / connect callers receive
 * a string, never a (potentially lossy) JS number.
 */

import type { Train2GoExtensionResponse } from "./train2go-send-message";

type RawPingData = {
  sessionActive: boolean;
  userId?: number | string;
  userName?: string;
};

export type Train2GoPingResult = {
  ok: boolean;
  protocolVersion?: number;
  sessionActive: boolean;
  externalUserId: string | null;
  externalUserName: string | null;
  error?: string;
};

const stringifyUserId = (raw: number | string | undefined): string | null => {
  if (raw === undefined || raw === null) return null;
  return typeof raw === "string" ? raw : String(raw);
};

export const toPingResult = (
  res: Train2GoExtensionResponse
): Train2GoPingResult => {
  const data = (res.data as RawPingData | undefined) ?? undefined;
  return {
    ok: res.ok,
    protocolVersion: res.protocolVersion,
    sessionActive: data?.sessionActive === true,
    externalUserId: stringifyUserId(data?.userId),
    externalUserName: data?.userName ?? null,
    error: res.error,
  };
};
