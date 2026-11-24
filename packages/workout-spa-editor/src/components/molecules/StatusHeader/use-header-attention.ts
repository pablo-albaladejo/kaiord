/**
 * The header's wording for the shared attention model.
 *
 * `null` is the healthy state and the whole pill disappears: a chrome
 * element that is always present stops being a signal, so there is no
 * "everything is fine" variant to render.
 *
 * The fact is `useConnectionAttention` — the same derivation the Settings
 * banner reads — so the two can differ in phrasing but never in verdict.
 *
 * The header is on every route, and a healthy one words no notice, so the
 * shared notices load only once a source needs attention: `detail` is
 * `null` until they have (or if their chunk could not be fetched), while the
 * count and the title show at once.
 */
import { attentionCauseText } from "../../../application/connections/attention-cause-copy";
import { useConnectionAttention } from "../../../hooks/connections/use-connection-attention";
import { useConnectionNotices } from "../../../i18n/connection-notices";
import { useActiveLocale } from "../../../i18n/LocaleProvider";
import { useTranslate } from "../../../i18n/use-translate";

export type HeaderAttention = {
  readonly count: number;
  readonly title: string;
  readonly detail: string | null;
};

export const useHeaderAttention = (): HeaderAttention | null => {
  const t = useTranslate("nav");
  const tCommon = useTranslate("common");
  const locale = useActiveLocale();
  const attention = useConnectionAttention();
  const notices = useConnectionNotices(attention !== null);

  if (attention === null) return null;
  return {
    count: attention.count,
    title: t(attention.count === 1 ? "alert.title_one" : "alert.title_other", {
      count: attention.count,
    }),
    detail: notices
      ? attentionCauseText(
          attention.cause,
          tCommon,
          locale,
          notices.connectionNotice
        )
      : null,
  };
};
