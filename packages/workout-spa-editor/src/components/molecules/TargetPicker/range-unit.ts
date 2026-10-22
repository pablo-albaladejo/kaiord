import { getTranslate, type Translate } from "../../../i18n/use-translate";
import type { Target } from "../../../types/krd";

/** Unit a power range's bounds are typed in: %FTP with `basis`, else watts. */
export const getRangeUnit = (
  target: Target | null | undefined,
  t: Translate = getTranslate("targets")
): string | undefined => {
  if (target?.type !== "power" || target.value.unit !== "range") return;
  return target.value.basis === "percent_ftp"
    ? t("range.unitPercentFtp")
    : t("range.unitWatts");
};
