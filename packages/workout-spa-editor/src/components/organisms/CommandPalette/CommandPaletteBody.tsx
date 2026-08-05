import { useState } from "react";

import { useEditorCommands } from "../../../hooks/use-editor-commands";
import { useTranslate } from "../../../i18n/use-translate";
import { filterCommands, flattenSections } from "./command-palette-filter";
import { CommandPaletteFooter } from "./CommandPaletteFooter";
import { CommandPaletteInput } from "./CommandPaletteInput";
import { CommandPaletteList } from "./CommandPaletteList";
import { useCommandPaletteNav } from "./use-command-palette-nav";

export type CommandPaletteBodyProps = {
  onClose: () => void;
  onShowShortcuts: () => void;
};

/**
 * Lives INSIDE `Dialog.Content`, which Radix unmounts on close, so the query
 * and the active row reset by unmounting. Holding them in `CommandPalette`
 * would leak them across openings — `useLazyDialog` latches `mounted`, so the
 * outer component never unmounts once the palette has been opened.
 *
 * That makes the reset depend on the unmount being immediate, which is why
 * this dialog carries no exit animation — see `palette-styles.ts`.
 */
export function CommandPaletteBody({
  onClose,
  onShowShortcuts,
}: CommandPaletteBodyProps) {
  const t = useTranslate("palette");
  const { commands } = useEditorCommands();
  const [query, setQuery] = useState("");

  const sections = filterCommands(commands, query, t);
  const flat = flattenSections(sections);
  const nav = useCommandPaletteNav({ commands: flat, onRun: onClose });
  const active = flat[nav.activeIndex];

  return (
    <>
      <CommandPaletteInput
        value={query}
        onChange={setQuery}
        onKeyDown={nav.handleKeyDown}
        hasResults={sections.length > 0}
        activeOptionId={
          active ? `command-palette-option-${active.id}` : undefined
        }
      />
      {sections.length === 0 ? (
        <p role="status" className="px-4 py-6 text-sm text-ink-muted">
          {t("empty")}
        </p>
      ) : (
        <CommandPaletteList
          sections={sections}
          activeIndex={nav.activeIndex}
          onActivate={nav.runAt}
          onHover={nav.setActiveIndex}
        />
      )}
      <CommandPaletteFooter onShowShortcuts={onShowShortcuts} />
    </>
  );
}
