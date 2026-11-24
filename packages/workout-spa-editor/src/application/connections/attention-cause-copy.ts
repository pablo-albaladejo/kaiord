/**
 * The one sentence per attention cause, shared by the Settings banner and
 * the header pill. A lone source reads its own Connection notice, the same
 * words its card and its extension popup show; several share one sentence in
 * the `common` namespace.
 *
 * The notice is passed in (`connectionNotice` from
 * `@kaiord/i18n/connection-notices`): the header pill loads the notices only
 * once a Connection needs attention, so this module must not import them.
 */
import type { Locale } from "@kaiord/i18n";
import type { connectionNotice } from "@kaiord/i18n/connection-notices";

import type { Translate } from "../../i18n/use-translate";
import type { AttentionCause } from "./source-attention";

export const attentionCauseText = (
  cause: AttentionCause,
  t: Translate,
  locale: Locale,
  noticeOf: typeof connectionNotice
): string => {
  if (cause.kind === "several") return t("sourceHealth.several");
  const notice = noticeOf(cause.connection, cause.name, locale);
  return notice?.message ?? t("sourceHealth.several");
};
