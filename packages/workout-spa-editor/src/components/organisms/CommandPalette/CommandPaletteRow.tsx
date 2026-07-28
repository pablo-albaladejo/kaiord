import { SHORTCUT_CATALOG } from "../../../constants/shortcut-catalog";
import type { EditorCommand } from "../../../hooks/editor-command.types";
import { useTranslate } from "../../../i18n/use-translate";
import { KeyChips } from "../../atoms/KeyChips";

export type CommandPaletteRowProps = {
  command: EditorCommand;
  active: boolean;
  onActivate: () => void;
  onHover: () => void;
};

const ROW_BASE =
  "flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 text-sm";

export function CommandPaletteRow({
  command,
  active,
  onActivate,
  onHover,
}: CommandPaletteRowProps) {
  const t = useTranslate("palette");
  const def = SHORTCUT_CATALOG.find((row) => row.id === command.shortcutId);
  const tone = command.enabled
    ? "text-gray-800 dark:text-gray-100"
    : "cursor-not-allowed text-gray-400 dark:text-gray-500";

  return (
    <div
      role="option"
      id={`command-palette-option-${command.id}`}
      aria-selected={active}
      aria-disabled={!command.enabled}
      data-testid={`command-palette-row-${command.id}`}
      onClick={command.enabled ? onActivate : undefined}
      onMouseEnter={onHover}
      className={`${ROW_BASE} ${tone} ${
        active ? "bg-primary-50 dark:bg-primary-900/40" : ""
      }`}
    >
      <span className="flex min-w-0 flex-1 flex-col">
        <span className="font-semibold">
          {t(command.titleKey, command.titleParams)}
        </span>
        {command.subtitleKey && (
          <span className="text-xs text-gray-500 dark:text-gray-400">
            {t(command.subtitleKey)}
          </span>
        )}
      </span>
      {def && <KeyChips def={def} />}
    </div>
  );
}
