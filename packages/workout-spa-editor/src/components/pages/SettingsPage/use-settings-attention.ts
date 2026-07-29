/**
 * The Settings shell's attention model — the banner above the index and the
 * chip on the section rail. Returns `null` when no connection needs
 * attention, which is what both slots render as nothing.
 *
 * It reads the same `useConnectionSources` list the Connections section
 * renders, so the count in the banner and the number of amber cards behind it
 * can never disagree.
 */

import { useConnectionSources } from "../../../hooks/connections/use-connection-sources";
import { useActiveProfileLive } from "../../../hooks/use-active-profile-live";
import { useTranslate } from "../../../i18n/use-translate";
import { buildAttention } from "./connection-attention";
import type { SettingsAttentionModel } from "./SettingsAttention";

export const useSettingsAttention = (): SettingsAttentionModel | null => {
  const t = useTranslate("settings");
  const profile = useActiveProfileLive();
  const sources = useConnectionSources(profile?.id ?? null);

  return buildAttention(sources, t);
};
