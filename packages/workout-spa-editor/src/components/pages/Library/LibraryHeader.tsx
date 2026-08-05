import { useTranslate } from "../../../i18n/use-translate";
import { ROUTE_HEADING_ATTR } from "../../../routing/constants";

export type LibraryHeaderProps = {
  count: number;
};

export function LibraryHeader({ count }: LibraryHeaderProps) {
  const t = useTranslate("library");
  return (
    <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
      <h1
        tabIndex={-1}
        {...{ [ROUTE_HEADING_ATTR]: "" }}
        className="m-0 flex-1 text-[24px] font-semibold tracking-[-0.026em] text-ink-strong"
      >
        {t("header.title")}
      </h1>
      <p className="m-0 text-[13px] tabular-nums text-ink-muted">
        {t(count === 1 ? "header.count_one" : "header.count_other", { count })}
      </p>
    </div>
  );
}
