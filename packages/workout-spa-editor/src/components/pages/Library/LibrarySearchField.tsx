import { useTranslate } from "../../../i18n/use-translate";
import { Icon, ICON_MAP } from "../../atoms/Icon";

export type LibrarySearchFieldProps = {
  value: string;
  onChange: (value: string) => void;
};

export function LibrarySearchField({
  value,
  onChange,
}: LibrarySearchFieldProps) {
  const t = useTranslate("library");
  return (
    <div className="flex items-center gap-2 rounded-lg border border-edge bg-surface-deep px-3 py-2">
      <Icon icon={ICON_MAP.target} size="sm" color="muted" />
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={t("search.placeholder")}
        aria-label={t("search.ariaLabel")}
        className="w-full bg-transparent text-[14px] text-ink-strong placeholder:text-ink-muted focus:outline-none"
      />
    </div>
  );
}
