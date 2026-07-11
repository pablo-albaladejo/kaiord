import { useTranslate } from "../../../i18n/use-translate";
import { Button } from "../../atoms/Button/Button";
import type { EntryDef } from "./status-entry-defs";

/** Accent treatment for the active header entry, merged through the Button
    atom's existing `className` join (the atom is left untouched). */
const ACTIVE_ENTRY_CLASS = "text-sky-500 dark:text-sky-400";

type EntryButtonProps = {
  entry: EntryDef;
  active: boolean;
  onClick: () => void;
};

export function EntryButton({ entry, active, onClick }: EntryButtonProps) {
  const t = useTranslate("nav");
  const button = (
    <Button
      variant={entry.variant ?? "tertiary"}
      size="sm"
      onClick={onClick}
      aria-label={entry.ariaLabel ? t(`aria.${entry.id}`) : undefined}
      aria-current={active ? "page" : undefined}
      className={active ? ACTIVE_ENTRY_CLASS : undefined}
      data-testid={`status-header-${entry.id}-button`}
    >
      <entry.icon className="h-4 w-4" />
      <span className={entry.id === "new" ? "" : "hidden md:inline"}>
        {t(entry.id)}
      </span>
    </Button>
  );
  if (!entry.mobileHidden) return button;
  // Wrapped (instead of passed into the Button's own className) because
  // the Button atom's `baseClasses` hardcodes `inline-flex` — combined on
  // the same element, `hidden` and `inline-flex` are equal-specificity
  // utilities and whichever Tailwind happens to emit last wins, which is
  // NOT reliably `hidden`. A plain wrapper has no competing display class.
  return <span className="hidden md:inline-flex">{button}</span>;
}
