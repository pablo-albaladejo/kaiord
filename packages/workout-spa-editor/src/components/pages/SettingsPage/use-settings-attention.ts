/**
 * The Settings shell's attention model — the banner above the index and the
 * chip on the section rail. Returns `null` when no connection needs
 * attention, which is what both slots render as nothing.
 */

import { useActiveProfileLive } from "../../../hooks/use-active-profile-live";
import { useBridgeConnections } from "../../../hooks/use-bridge-connections";
import { useTranslate } from "../../../i18n/use-translate";
import { buildAttention } from "./connection-attention";
import type { SettingsAttentionModel } from "./SettingsAttention";

export const useSettingsAttention = (): SettingsAttentionModel | null => {
  const t = useTranslate("settings");
  const profile = useActiveProfileLive();
  const connections = useBridgeConnections(profile?.id ?? null);

  return buildAttention(connections, t);
};
