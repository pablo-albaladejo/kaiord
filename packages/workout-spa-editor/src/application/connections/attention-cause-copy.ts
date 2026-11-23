/**
 * The one sentence per attention cause, shared by the Settings banner and
 * the header pill. A lone source reads its own Connection notice, the same
 * words its card and its extension popup show; several share one sentence in
 * the `common` namespace.
 */
import { connectionNotice, type Locale } from "@kaiord/i18n";

import type { Translate } from "../../i18n/use-translate";
import type { AttentionCause } from "./source-attention";

export const attentionCauseText = (
  cause: AttentionCause,
  t: Translate,
  locale: Locale
): string => {
  if (cause.kind === "several") return t("sourceHealth.several");
  const notice = connectionNotice(cause.connection, cause.name, locale);
  return notice?.message ?? t("sourceHealth.several");
};
