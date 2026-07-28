import { normalizeSearchText } from "../../../application/chat/normalize-search-text";
import type {
  EditorCommand,
  EditorCommandGroup,
} from "../../../hooks/editor-command.types";
import type { Translate } from "../../../i18n/use-translate";

/** Render order of the palette's sections. */
export const PALETTE_GROUPS = [
  "do",
  "learn",
] as const satisfies ReadonlyArray<EditorCommandGroup>;

export type CommandPaletteSection = {
  group: EditorCommandGroup;
  commands: ReadonlyArray<EditorCommand>;
};

/**
 * Case- and accent-insensitive substring match over the TRANSLATED title, so
 * the query the user reads is the text they are searching. Empty sections are
 * dropped; an empty query keeps everything.
 */
export const filterCommands = (
  commands: ReadonlyArray<EditorCommand>,
  query: string,
  t: Translate
): ReadonlyArray<CommandPaletteSection> => {
  const needle = normalizeSearchText(query.trim());
  const matches =
    needle.length === 0
      ? commands
      : commands.filter((command) =>
          normalizeSearchText(
            t(command.titleKey, command.titleParams)
          ).includes(needle)
        );

  return PALETTE_GROUPS.map((group) => ({
    group,
    commands: matches.filter((command) => command.group === group),
  })).filter((section) => section.commands.length > 0);
};

/** The sections flattened into keyboard-navigation order. */
export const flattenSections = (
  sections: ReadonlyArray<CommandPaletteSection>
): ReadonlyArray<EditorCommand> =>
  sections.flatMap((section) => section.commands);
