import { describe, expect, it, vi } from "vitest";

import { buildDoCommands } from "./build-do-commands";
import type { EditorCommandGuards } from "./editor-command.types";
import type { KeyboardShortcutHandlers } from "./keyboard-shortcut-handlers";

const CLOSED: EditorCommandGuards = {
  canCut: false,
  canCopy: false,
  canPaste: false,
  canDelete: false,
  canSelectAll: false,
  canGroup: false,
  canUngroup: false,
  canUndo: false,
  canRedo: false,
  canSave: false,
  selectedCount: 0,
};

const OPEN: EditorCommandGuards = {
  canCut: true,
  canCopy: true,
  canPaste: true,
  canDelete: true,
  canSelectAll: true,
  canGroup: true,
  canUngroup: true,
  canUndo: true,
  canRedo: true,
  canSave: true,
  selectedCount: 3,
};

const build = (guards: EditorCommandGuards, handlers = {}) =>
  buildDoCommands({ handlers, guards });

const at = (guards: EditorCommandGuards, id: string, handlers = {}) => {
  const command = build(guards, handlers).find((c) => c.id === id);
  if (!command) throw new Error(`no command ${id}`);
  return command;
};

describe("buildDoCommands", () => {
  describe("guards", () => {
    it("should enable every command when all guards are open", () => {
      // Arrange

      // Act
      const commands = build(OPEN);

      // Assert
      expect(commands.every((command) => command.enabled)).toBe(true);
    });

    it("should disable every command when all guards are closed", () => {
      // Arrange

      // Act
      const commands = build(CLOSED);

      // Assert
      expect(commands.some((command) => command.enabled)).toBe(false);
    });

    it.each([
      { id: "cut", guard: "canCut" },
      { id: "copy", guard: "canCopy" },
      { id: "paste", guard: "canPaste" },
      { id: "delete", guard: "canDelete" },
      { id: "select-all", guard: "canSelectAll" },
      { id: "create-block", guard: "canGroup" },
      { id: "ungroup-block", guard: "canUngroup" },
      { id: "undo", guard: "canUndo" },
      { id: "redo", guard: "canRedo" },
      { id: "save", guard: "canSave" },
    ])("should enable $id from the $guard guard alone", ({ id, guard }) => {
      // Arrange
      const guards = { ...CLOSED, [guard]: true };

      // Act
      const command = at(guards, id);

      // Assert
      expect(command.enabled).toBe(true);
    });
  });

  describe("run delegation", () => {
    it.each([
      { id: "cut", handler: "onCut" },
      { id: "copy", handler: "onCopy" },
      { id: "paste", handler: "onPaste" },
      { id: "delete", handler: "onDelete" },
      { id: "select-all", handler: "onSelectAll" },
      { id: "create-block", handler: "onCreateBlock" },
      { id: "ungroup-block", handler: "onUngroupBlock" },
      { id: "undo", handler: "onUndo" },
      { id: "redo", handler: "onRedo" },
      { id: "save", handler: "onSave" },
    ])("should run $id through the $handler thunk", ({ id, handler }) => {
      // Arrange
      const spy = vi.fn().mockReturnValue(true);
      const handlers: KeyboardShortcutHandlers = { [handler]: spy };

      // Act
      at(OPEN, id, handlers).run();

      // Assert
      expect(spy).toHaveBeenCalledOnce();
    });

    it("should not throw when the thunk is absent", () => {
      // Arrange
      const command = at(OPEN, "undo");

      // Act
      const run = () => command.run();

      // Assert
      expect(run).not.toThrow();
    });
  });

  describe("copy honesty", () => {
    it("should point create-block at the dialog rather than a direct run", () => {
      // Arrange

      // Act
      const command = at(OPEN, "create-block");

      // Assert
      expect(command.subtitleKey).toBe("commands.create-block.subtitle");
    });

    it("should explain the closed guard in the subtitle", () => {
      // Arrange

      // Act
      const command = at(CLOSED, "create-block");

      // Assert
      expect(command.subtitleKey).toBe("commands.create-block.requires");
    });

    it("should title create-block with the selected count when groupable", () => {
      // Arrange

      // Act
      const command = at(OPEN, "create-block");

      // Assert
      expect(command).toMatchObject({
        titleKey: "commands.create-block.titleCount",
        titleParams: { count: 3 },
      });
    });

    it("should drop the count from the title when not groupable", () => {
      // Arrange

      // Act
      const command = at(CLOSED, "create-block");

      // Assert
      expect(command.titleKey).toBe("commands.create-block.title");
    });
  });

  describe("catalog pairing", () => {
    it("should carry a shortcutId equal to the command id", () => {
      // Arrange

      // Act
      const commands = build(OPEN);

      // Assert
      expect(commands.every((c) => c.shortcutId === c.id)).toBe(true);
    });

    it("should place every command in the do group", () => {
      // Arrange

      // Act
      const commands = build(OPEN);

      // Assert
      expect(commands.every((command) => command.group === "do")).toBe(true);
    });
  });
});
