import { useActiveLocale } from "../../../i18n/LocaleProvider";
import { useTranslate } from "../../../i18n/use-translate";

export type LibraryPickerHintProps = { date: string | null };

export function LibraryPickerHint({ date }: LibraryPickerHintProps) {
  const t = useTranslate("library");
  const locale = useActiveLocale();
  const formatted = date
    ? new Date(`${date}T12:00:00Z`).toLocaleDateString(locale, {
        weekday: "long",
        month: "long",
        day: "numeric",
        year: "numeric",
        timeZone: "UTC",
      })
    : null;

  return (
    <p
      data-testid="library-picker-hint"
      className="m-0 text-sm text-ink-muted"
      role="status"
    >
      {formatted
        ? t("picker.hintDated", { date: formatted })
        : t("picker.hint")}
    </p>
  );
}
