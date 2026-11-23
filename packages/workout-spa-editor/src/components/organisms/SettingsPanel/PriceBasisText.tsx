import type { PriceBasis } from "../../../application/usage/price-basis";
import { useActiveLocale } from "../../../i18n/LocaleProvider";
import { useTranslate } from "../../../i18n/use-translate";
import { formatUsageCost } from "./format-usage-cost";

/** A model's per-million-token prices and where they were read, or "unknown". */
export function PriceBasisText({ basis }: { basis: PriceBasis }) {
  const t = useTranslate("settings");
  const locale = useActiveLocale();
  if (basis.kind === "unknown") return <span>{t("price.unknown")}</span>;
  const usd = (n: number) => formatUsageCost(n, locale);
  const values = {
    input: usd(basis.input),
    output: usd(basis.output),
    date: basis.readOn,
  };
  const text =
    basis.cacheRead === undefined
      ? t("price.priced", values)
      : t("price.pricedCache", { ...values, cacheRead: usd(basis.cacheRead) });
  return (
    <span>
      {text}{" "}
      <a
        href={basis.source}
        target="_blank"
        rel="noreferrer"
        className="underline"
      >
        {t("price.source")}
      </a>
    </span>
  );
}
