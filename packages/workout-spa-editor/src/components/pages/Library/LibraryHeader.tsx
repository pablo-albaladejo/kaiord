import { useTranslate } from "../../../i18n/use-translate";
import { ROUTE_HEADING_ATTR } from "../../../routing/constants";

export type LibraryHeaderProps = {
  count: number;
};

export function LibraryHeader({ count }: LibraryHeaderProps) {
  const t = useTranslate("library");
  return (
    <div className="mb-1">
      <h1
        tabIndex={-1}
        {...{ [ROUTE_HEADING_ATTR]: "" }}
        className="m-0 text-[26px] font-extrabold tracking-[-0.02em] text-ink-strong"
      >
        {t("header.title")}
      </h1>
      <p className="mt-1 text-[13.5px] text-ink-muted">
        {t(count === 1 ? "header.count_one" : "header.count_other", { count })}
      </p>
    </div>
  );
}
