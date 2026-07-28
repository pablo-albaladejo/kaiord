import type { KeyboardEvent } from "react";
import { useEffect, useState } from "react";

import type { EditorCommand } from "../../../hooks/editor-command.types";

type CommandPaletteNavOptions = {
  /** Commands in render order; index 0 is the initial active row. */
  commands: ReadonlyArray<EditorCommand>;
  onRun: () => void;
};

/**
 * Arrow/Enter navigation for the palette list. Unlike the export-format
 * dropdown this does NOT move DOM focus onto rows — focus stays in the search
 * input so typing keeps working, and the active row is published through
 * `aria-activedescendant`. `Escape` is left to the Radix dialog.
 */
export function useCommandPaletteNav({
  commands,
  onRun,
}: CommandPaletteNavOptions) {
  const [activeIndex, setActiveIndex] = useState(0);

  // Re-filtering re-orders the list, so the previous index is meaningless.
  useEffect(() => setActiveIndex(0), [commands.length]);

  const runAt = (index: number): void => {
    const command = commands[index];
    if (!command?.enabled) return;
    command.run();
    onRun();
  };

  const handleKeyDown = (event: KeyboardEvent): void => {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, commands.length - 1));
      return;
    }
    if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
      return;
    }
    if (event.key === "Enter") {
      event.preventDefault();
      runAt(activeIndex);
    }
  };

  return { activeIndex, setActiveIndex, runAt, handleKeyDown };
}
