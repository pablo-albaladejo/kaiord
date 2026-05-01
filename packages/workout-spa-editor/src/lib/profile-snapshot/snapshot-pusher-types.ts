import type { BridgeRepository } from "../../adapters/bridge/bridge-types";

export type SnapshotTransport = (
  extensionId: string,
  message: unknown
) => Promise<{ ok: boolean; error?: string }>;

export type SnapshotPusherDeps = {
  readonly transport: SnapshotTransport;
  readonly bridges: BridgeRepository;
  readonly enqueue: <T>(args: {
    bridgeId: string;
    execute: () => Promise<T>;
  }) => Promise<T>;
};

export type PushOutcome =
  | "sent"
  | "deduped"
  | "rate-limited"
  | "skipped"
  | "failed";
