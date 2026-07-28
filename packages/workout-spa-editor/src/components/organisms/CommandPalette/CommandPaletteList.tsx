import { useTranslate } from "../../../i18n/use-translate";
import type { CommandPaletteSection } from "./command-palette-filter";
import { CommandPaletteRow } from "./CommandPaletteRow";

export type CommandPaletteListProps = {
  sections: ReadonlyArray<CommandPaletteSection>;
  /** Index into the flattened sections. */
  activeIndex: number;
  onActivate: (index: number) => void;
  onHover: (index: number) => void;
};

const HEADING =
  "px-3 pb-1 pt-2 text-[10.5px] font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400";

export function CommandPaletteList({
  sections,
  activeIndex,
  onActivate,
  onHover,
}: CommandPaletteListProps) {
  const t = useTranslate("palette");
  let index = -1;

  return (
    <div
      role="listbox"
      id="command-palette-list"
      aria-label={t("listLabel")}
      className="max-h-[50vh] overflow-y-auto p-2"
    >
      {sections.map((section) => (
        <div
          key={section.group}
          role="group"
          aria-labelledby={`command-palette-group-${section.group}`}
        >
          <h3 id={`command-palette-group-${section.group}`} className={HEADING}>
            {t(`groups.${section.group}`)}
          </h3>
          {section.commands.map((command) => {
            index += 1;
            const at = index;
            return (
              <CommandPaletteRow
                key={command.id}
                command={command}
                active={at === activeIndex}
                onActivate={() => onActivate(at)}
                onHover={() => onHover(at)}
              />
            );
          })}
        </div>
      ))}
    </div>
  );
}
