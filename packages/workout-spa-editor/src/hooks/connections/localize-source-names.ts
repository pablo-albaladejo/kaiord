import type { ConnectionSource } from "../../application/connections/connection-source";
import type { Translate } from "../../i18n/use-translate";

/** Brand names stay as they are; manual entry is ours, so it is translated. */
export const localizeSourceNames = (
  sources: readonly ConnectionSource[],
  t: Translate
): readonly ConnectionSource[] =>
  sources.map((s) =>
    s.id === "manual" ? { ...s, name: t("sourceName.manual") } : s
  );
