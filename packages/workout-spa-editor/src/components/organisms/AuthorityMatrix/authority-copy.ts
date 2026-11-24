import type { AuthorityOptions } from "../../../application/connections/authority-options";
import { toIntegrationId } from "../../../application/connections/data-type-sources";
import type { Translate } from "../../../i18n/use-translate";
import { sourceName } from "../Connections/routing-copy";

export const choiceLabel = (sourceId: string, t: Translate): string =>
  sourceName(toIntegrationId(sourceId), t);

const SENTENCE = {
  union: "authority.keepsAll",
  priority: "authority.picked",
  automatic: "authority.automaticNow",
} as const;

/** What decides the kind today, said before any button can change it. */
export const authorityNow = (
  options: AuthorityOptions,
  type: string,
  t: Translate,
  tConnections: Translate
): string => {
  if (options.decides === undefined || options.mode === "union") {
    return options.mode === "priority"
      ? t("authority.stalled", { type })
      : t("authority.keepsAll", { type });
  }
  return t(SENTENCE[options.mode], {
    type,
    name: choiceLabel(options.decides, tConnections),
  });
};
