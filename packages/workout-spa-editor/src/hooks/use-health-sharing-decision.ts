import type { LlmProviderType } from "@kaiord/ai/providers";
import { useCallback, useSyncExternalStore } from "react";

import {
  type HealthSharingDecision,
  healthSharingStore,
} from "../lib/health-sharing-store";

/** The standing answer for one Provider, and its setter (null: ask again). */
export const useHealthSharingDecision = (
  type: LlmProviderType
): [
  HealthSharingDecision | null,
  (decision: HealthSharingDecision | null) => void,
] => {
  const decisions = useSyncExternalStore(
    healthSharingStore.subscribe,
    healthSharingStore.read
  );
  const set = useCallback(
    (decision: HealthSharingDecision | null) =>
      healthSharingStore.set(type, decision),
    [type]
  );
  return [decisions[type] ?? null, set];
};
