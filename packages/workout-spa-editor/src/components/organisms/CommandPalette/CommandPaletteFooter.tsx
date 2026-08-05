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
    <div className="flex items-center gap-4 border-t border-edge bg-surface-page px-4 py-2.5 text-xs text-ink-muted">
      <span>{t("footer.run")}</span>
      <button
        type="button"
        onClick={onShowShortcuts}
        className="rounded hover:text-ink-strong focus:outline-none focus:ring-2 focus:ring-accent"
      >
        {t("footer.shortcuts")}
      </button>
      <span className="flex-1" />
      <a
        href={DOCS_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="text-ink-strong hover:underline"
      >
        {t("footer.docs")}
      </a>
    </div>
  );
}
