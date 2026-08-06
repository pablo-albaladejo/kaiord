import { useTranslate } from "../../../i18n/use-translate";
import { Button } from "../../atoms/Button/Button";
import { BAR_WRAPPER_CLASS } from "./header-menu-styles";
import type { EntryDef } from "./status-entry-defs";

/** Accent treatment for the active header entry, merged through the Button
    atom's existing `className` join (the atom is left untouched). */
const ACTIVE_ENTRY_CLASS = "text-accent";

type EntryButtonProps = {
  entry: EntryDef;
  active: boolean;
  onClick: () => void;
};

export function EntryButton({ entry, active, onClick }: EntryButtonProps) {
  const t = useTranslate("nav");
  const button = (
    <Button
      variant="tertiary"
      size="sm"
      onClick={onClick}
      aria-label={entry.ariaLabel ? t(`aria.${entry.id}`) : undefined}
      aria-current={active ? "page" : undefined}
      className={active ? ACTIVE_ENTRY_CLASS : undefined}
      data-testid={`status-header-${entry.id}-button`}
    >
      <entry.icon className="h-4 w-4" />
      <span className="hidden md:inline">{t(entry.id)}</span>
    </Button>
  );
  const wrapper = BAR_WRAPPER_CLASS[entry.barVisibility];
  if (wrapper === null) return button;
  return <span className={wrapper}>{button}</span>;
}
