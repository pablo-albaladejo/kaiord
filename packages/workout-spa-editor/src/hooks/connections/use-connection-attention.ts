/**
 * useConnectionAttention — the single reactive attention model.
 *
 * Both surfaces that report a broken source read this: the Settings banner
 * and rail chip, and the header's source-health pill. They render it with
 * different words; neither derives it again. An earlier pair of independent
 * predicates disagreed, and the banner contradicted the cards below it.
 *
 * `null` is the healthy state, which every consumer renders as nothing.
 */
import type { ConnectionAttention } from "../../application/connections/source-attention";
import { buildConnectionAttention } from "../../application/connections/source-attention";
import { useActiveProfileLive } from "../use-active-profile-live";
import { useConnectionSources } from "./use-connection-sources";

export const useConnectionAttention = (): ConnectionAttention | null => {
  const profile = useActiveProfileLive();
  const sources = useConnectionSources(profile?.id ?? null);

  return buildConnectionAttention(sources);
};
