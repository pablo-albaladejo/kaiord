import { describe, expect, it, vi } from "vitest";

import type { EditorCommand } from "../../../hooks/editor-command.types";
import {
  contextMenuPropsFrom,
  hasAnyContextMenuAction,
} from "./context-menu-props-from-commands";

const MENU_IDS = [
  "cut",
  "copy",
  "paste",
  "delete",
  "select-all",
  "create-block",
  "ungroup-block",
] as const;

const command = (
  id: string,
  enabled: boolean,
  run = vi.fn()
): EditorCommand => ({
  id,
  group: "do",
  titleKey: `commands.${id}.title`,
  enabled,
  run,
});

const listWith = (enabledIds: ReadonlyArray<string>) =>
  MENU_IDS.map((id) => command(id, enabledIds.includes(id)));

describe("contextMenuPropsFrom", () => {
  describe("visibility", () => {
    it.each([
      { id: "cut", prop: "showCut" },
      { id: "copy", prop: "showCopy" },
      { id: "paste", prop: "showPaste" },
      { id: "delete", prop: "showDelete" },
      { id: "select-all", prop: "showSelectAll" },
      { id: "create-block", prop: "showGroup" },
      { id: "ungroup-block", prop: "showUngroup" },
    ])("should map the $id command onto $prop", ({ id, prop }) => {
      // Arrange
      const commands = listWith([id]);

      // Act
      const props = contextMenuPropsFrom(commands);

      // Assert
      expect(props[prop as keyof typeof props]).toBe(true);
    });

    it("should hide an item whose command is missing from the list", () => {
      // Arrange
      const commands: ReadonlyArray<EditorCommand> = [];

      // Act
      const props = contextMenuPropsFrom(commands);

      // Assert
      expect(props.showCut).toBe(false);
    });
  });

  describe("action delegation", () => {
    it.each([
      { id: "cut", prop: "onCut" },
      { id: "copy", prop: "onCopy" },
      { id: "paste", prop: "onPaste" },
      { id: "delete", prop: "onDelete" },
      { id: "select-all", prop: "onSelectAll" },
      { id: "create-block", prop: "onGroup" },
      { id: "ungroup-block", prop: "onUngroup" },
    ])("should route $prop to the $id command run", ({ id, prop }) => {
      // Arrange
      const run = vi.fn();
      const commands = MENU_IDS.map((menuId) =>
        command(menuId, true, menuId === id ? run : vi.fn())
      );

      // Act
      contextMenuPropsFrom(commands)[prop as "onCut"]();

      // Assert
      expect(run).toHaveBeenCalledOnce();
    });
  });

  describe("hasAnyContextMenuAction", () => {
    it("should be false when no command is enabled", () => {
      // Arrange
      const props = contextMenuPropsFrom(listWith([]));

      // Act
      const any = hasAnyContextMenuAction(props);

      // Assert
      expect(any).toBe(false);
    });

    it.each(MENU_IDS)("should be true when only %s is enabled", (id) => {
      // Arrange
      const props = contextMenuPropsFrom(listWith([id]));

      // Act
      const any = hasAnyContextMenuAction(props);

      // Assert
      expect(any).toBe(true);
    });
  });
});
