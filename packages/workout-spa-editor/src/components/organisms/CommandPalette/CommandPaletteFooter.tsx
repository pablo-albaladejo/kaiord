import { DOCS_URL } from "../../../hooks/build-learn-commands";
import { useTranslate } from "../../../i18n/use-translate";

export type CommandPaletteFooterProps = {
  onShowShortcuts: () => void;
};

export function CommandPaletteFooter({
  onShowShortcuts,
}: CommandPaletteFooterProps) {
  const t = useTranslate("palette");

  return (
    <div className="flex items-center gap-4 border-t border-gray-200 bg-gray-50 px-4 py-2.5 text-xs text-gray-500 dark:border-slate-800 dark:bg-slate-950 dark:text-gray-400">
      <span>{t("footer.run")}</span>
      <button
        type="button"
        onClick={onShowShortcuts}
        className="rounded hover:text-gray-800 focus:outline-none focus:ring-2 focus:ring-primary-500 dark:hover:text-gray-200"
      >
        {t("footer.shortcuts")}
      </button>
      <span className="flex-1" />
      <a
        href={DOCS_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="text-primary-600 hover:underline dark:text-primary-400"
      >
        {t("footer.docs")}
      </a>
    </div>
  );
}
