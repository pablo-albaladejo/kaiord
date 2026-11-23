import { describe, expect, it } from "vitest";

import type { ShortcutDef } from "../constants/shortcut-catalog";
import { offeredShortcutHandlers } from "./offered-shortcut-handlers";

const ROWS: ReadonlyArray<ShortcutDef> = [
  {
    id: "save",
    group: "file",
    keys: ["Ctrl", "S"],
    labelKey: "shortcuts.file.save",
    handlerKey: "onSave",
  },
  {
    id: "undo",
    group: "edit",
    keys: ["Ctrl", "Z"],
    labelKey: "shortcuts.edit.undo",
    handlerKey: "onUndo",
  },
];

describe("offeredShortcutHandlers", () => {
  it("should drop the handler of a shortcut an off Capability owns", () => {
    // Arrange
    const handlers = { onSave: () => true, onUndo: () => true };

    // Act
    const offered = offeredShortcutHandlers(
      handlers,
      (_kind, id) => id !== "undo",
      ROWS
    );

    // Assert
    expect(offered.onSave).toBe(handlers.onSave);
    expect(offered.onUndo).toBeUndefined();
  });

  it("should keep every handler when every shortcut is offered", () => {
    // Arrange
    const handlers = { onSave: () => true, onUndo: () => true };

    // Act
    const offered = offeredShortcutHandlers(handlers, () => true, ROWS);

    // Assert
    expect(offered).toEqual(handlers);
  });
});
