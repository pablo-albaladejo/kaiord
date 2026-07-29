/**
 * The Settings shell's attention model — the banner above the index and the
 * chip on the section rail. Returns `null` when no connection needs
 * attention, which is what both slots render as nothing.
 *
 * The fact comes from `useConnectionAttention`, the same derivation the
 * header pill reads, so the count in the banner and the number of amber
 * cards behind it can never disagree. Only the wording is local: Settings
 * says "connections need attention" beside its Connections row, the header
 * says "sources down" beside the rest of the app.
 */

import { attentionCauseText } from "../../../application/connections/attention-cause-copy";
import { useConnectionAttention } from "../../../hooks/connections/use-connection-attention";
import { useTranslate } from "../../../i18n/use-translate";
import type { SettingsAttentionModel } from "./SettingsAttention";

export const useSettingsAttention = (): SettingsAttentionModel | null => {
  const t = useTranslate("settings");
  const tCommon = useTranslate("common");
  const attention = useConnectionAttention();

  if (attention === null) return null;
  return {
    title: t(
      attention.count === 1 ? "attention.title_one" : "attention.title_other",
      { count: attention.count }
    ),
    detail: attentionCauseText(attention.cause, tCommon),
  };
};
