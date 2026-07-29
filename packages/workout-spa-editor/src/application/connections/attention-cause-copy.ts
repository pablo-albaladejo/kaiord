/**
 * The one sentence per attention cause, shared by the Settings banner and
 * the header pill.
 *
 * The strings live in the `common` namespace rather than in either surface's
 * own: one catalog entry per cause is what keeps the banner and the pill from
 * diverging a locale at a time.
 */
import type { Translate } from "../../i18n/use-translate";
import type { AttentionCause } from "./source-attention";

export const attentionCauseText = (
  cause: AttentionCause,
  t: Translate
): string =>
  cause.kind === "noNewDataSince"
    ? t("sourceHealth.noNewDataSince", { date: cause.date })
    : t(`sourceHealth.${cause.kind}`);
