/**
 * Implements provider fallback (invariant I3): when the runtime store
 * still points at a provider the user has just deleted (or that has
 * not arrived yet on first load), reset the selection to the current
 * default. The single-frame transition is acceptable — any in-flight
 * generation already captured its provider via the call-time
 * `resolveProvider` lookup.
 */

import { useEffect } from "react";

import type { LlmProviderConfig } from "../../../store/ai-store-types";

export const useAiFallbackEffect = (
  providers: LlmProviderConfig[] | undefined,
  selectedProviderId: string | null,
  selectForGeneration: (id: string | null) => void
): void => {
  useEffect(() => {
    if (!providers) return;
    if (
      selectedProviderId &&
      !providers.some((p) => p.id === selectedProviderId)
    ) {
      selectForGeneration(providers.find((p) => p.isDefault)?.id ?? null);
    }
  }, [providers, selectedProviderId, selectForGeneration]);
};
