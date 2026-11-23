import type { ManagedDataType } from "@kaiord/core";

import { toIntegrationId } from "../../../application/connections/data-type-sources";
import type { SourceOfTruthOptions } from "../../../application/connections/source-of-truth-options";
import { automaticHead } from "../../../application/data-source-policy/automatic-authority";
import type { Translate } from "../../../i18n/use-translate";
import { sourceName } from "../Connections/routing-copy";

export const choiceLabel = (sourceId: string, t: Translate): string =>
  sourceName(toIntegrationId(sourceId), t);

/** What decides the kind today, said before any button can change it. */
export const authorityNow = (
  dataType: ManagedDataType,
  options: SourceOfTruthOptions,
  type: string,
  t: Translate,
  tConnections: Translate
): string => {
  if (options.mode === "union") return t("authority.keepsAll", { type });
  if (options.mode === "priority") {
    return options.current === undefined
      ? t("authority.stalled", { type })
      : t("authority.picked", {
          type,
          name: choiceLabel(options.current, tConnections),
        });
  }
  const head = automaticHead(dataType, options.choices);
  return head === undefined
    ? t("authority.keepsAll", { type })
    : t("authority.automaticNow", {
        type,
        name: choiceLabel(head, tConnections),
      });
};
