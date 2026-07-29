/**
 * The header's wording for the shared attention model.
 *
 * `null` is the healthy state and the whole pill disappears: a chrome
 * element that is always present stops being a signal, so there is no
 * "everything is fine" variant to render.
 *
 * The fact is `useConnectionAttention` — the same derivation the Settings
 * banner reads — so the two can differ in phrasing but never in verdict.
 */
import { attentionCauseText } from "../../../application/connections/attention-cause-copy";
import { useConnectionAttention } from "../../../hooks/connections/use-connection-attention";
import { useTranslate } from "../../../i18n/use-translate";

export type HeaderAttention = {
  readonly title: string;
  readonly detail: string;
};

export const useHeaderAttention = (): HeaderAttention | null => {
  const t = useTranslate("nav");
  const tCommon = useTranslate("common");
  const attention = useConnectionAttention();

  if (attention === null) return null;
  return {
    title: t(attention.count === 1 ? "alert.title_one" : "alert.title_other", {
      count: attention.count,
    }),
    detail: attentionCauseText(attention.cause, tCommon),
  };
};
