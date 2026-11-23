import type { ExtensionResponse } from "../../bridge/bridge-transport";

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

export const toPingResult = (res: ExtensionResponse): Train2GoPingResult => {
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
