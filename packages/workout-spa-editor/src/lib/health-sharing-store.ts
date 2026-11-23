/**
 * The athlete's standing answer, per Provider, on whether their health data
 * may go to it. It describes this device's choice, like the device
 * preferences, so it lives in this browser's localStorage and never rides the
 * Drive snapshot or a backup; "delete all data" clears it with the rest of
 * Web Storage. When storage throws, the answers last the session.
 */
import type { LlmProviderType } from "@kaiord/ai/providers";
import { z } from "zod";

export const HEALTH_SHARING_KEY = "kaiord-health-sharing";

export type HealthSharingDecision = "always" | "never";
export type HealthSharingDecisions = Partial<
  Record<LlmProviderType, HealthSharingDecision>
>;

const decisionsSchema = z
  .object({
    anthropic: z.enum(["always", "never"]).optional(),
    openai: z.enum(["always", "never"]).optional(),
    google: z.enum(["always", "never"]).optional(),
  })
  .strip();

export type HealthSharingStore = {
  read: () => HealthSharingDecisions;
  set: (type: LlmProviderType, decision: HealthSharingDecision | null) => void;
  subscribe: (listener: () => void) => () => void;
};

const parse = (raw: string | null): HealthSharingDecisions => {
  if (raw === null) return {};
  try {
    const result = decisionsSchema.safeParse(JSON.parse(raw));
    return result.success ? result.data : {};
  } catch {
    return {};
  }
};

export function createHealthSharingStore(
  getStorage: () => Storage
): HealthSharingStore {
  const listeners = new Set<() => void>();
  let memory: HealthSharingDecisions = {};
  let failed = false;
  // Same raw string → same object, as useSyncExternalStore requires.
  let cachedRaw: string | null = null;
  let cached: HealthSharingDecisions = {};

  const read = (): HealthSharingDecisions => {
    if (failed) return memory;
    try {
      const raw = getStorage().getItem(HEALTH_SHARING_KEY);
      if (raw !== cachedRaw) [cachedRaw, cached] = [raw, parse(raw)];
      return cached;
    } catch {
      failed = true;
      return memory;
    }
  };

  const set: HealthSharingStore["set"] = (type, decision) => {
    const rest = Object.fromEntries(
      Object.entries(read()).filter(([key]) => key !== type)
    ) as HealthSharingDecisions;
    memory = decision === null ? rest : { ...rest, [type]: decision };
    try {
      getStorage().setItem(HEALTH_SHARING_KEY, JSON.stringify(memory));
    } catch {
      failed = true;
    }
    listeners.forEach((listener) => listener());
  };

  const subscribe = (listener: () => void) => {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  };

  return { read, set, subscribe };
}

export const healthSharingStore = createHealthSharingStore(
  () => window.localStorage
);
