import { renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { SHORTCUT_CATALOG } from "../constants/shortcut-catalog";
import enPalette from "../i18n/locales/en/palette.json";
import { useEditorCommands } from "./use-editor-commands";

const hoisted = vi.hoisted(() => ({
  store: {} as Record<string, unknown>,
  clipboard: false,
}));

vi.mock("../store/selectors", () => ({
  useContextMenuStore: () => hoisted.store,
}));

vi.mock("../store/clipboard-store", () => ({
  hasClipboardContent: () => hoisted.clipboard,
}));

const WORKOUT = { steps: [] };

const setStore = (overrides: Record<string, unknown>): void => {
  hoisted.store = {
    currentWorkout: { extensions: { structured_workout: WORKOUT } },
    selectedStepId: null,
    selectedStepIds: [],
    selectStep: vi.fn(),
    clearStepSelection: vi.fn(),
    deleteStep: vi.fn(),
    copyStep: vi.fn(),
    pasteStep: vi.fn(),
    openCreateBlockDialog: vi.fn(),
    ungroupRepetitionBlock: vi.fn(),
    selectAllSteps: vi.fn(),
    undo: vi.fn(),
    redo: vi.fn(),
    canUndo: false,
    canRedo: false,
    reorderStep: vi.fn(),
    ...overrides,
  };
};

const resolve = (key: string): unknown =>
  key
    .split(".")
    .reduce<unknown>(
      (acc, segment) =>
        acc && typeof acc === "object"
          ? (acc as Record<string, unknown>)[segment]
          : undefined,
      enPalette
    );

const commands = () =>
  renderHook(() => useEditorCommands()).result.current.commands;

const byId = (id: string) => commands().find((command) => command.id === id);

describe("useEditorCommands", () => {
  beforeEach(() => {
    hoisted.clipboard = false;
    setStore({});
  });

  describe("selection-aware guards", () => {
    it("should disable create-block with a single step selected", () => {
      // Arrange
      setStore({ selectedStepId: "step-1", selectedStepIds: ["step-1"] });

      // Act
      const command = byId("create-block");

      // Assert
      expect(command?.enabled).toBe(false);
    });

    it("should enable create-block with two steps selected", () => {
      // Arrange
      setStore({ selectedStepIds: ["step-1", "step-2"] });

      // Act
      const command = byId("create-block");

      // Assert
      expect(command?.enabled).toBe(true);
    });

    it("should take the create-block title count from the selection", () => {
      // Arrange
      setStore({ selectedStepIds: ["a", "b", "c"] });

      // Act
      const command = byId("create-block");

      // Assert
      expect(command?.titleParams).toEqual({ count: 3 });
    });

    it("should enable undo only when the store can undo", () => {
      // Arrange
      setStore({ canUndo: true });

      // Act
      const enabled = byId("undo")?.enabled;

      // Assert
      expect(enabled).toBe(true);
    });

    it("should disable paste while the clipboard is empty", () => {
      // Arrange
      hoisted.clipboard = false;

      // Act
      const enabled = byId("paste")?.enabled;

      // Assert
      expect(enabled).toBe(false);
    });

    it("should enable paste once the clipboard holds a step", () => {
      // Arrange
      hoisted.clipboard = true;

      // Act
      const enabled = byId("paste")?.enabled;

      // Assert
      expect(enabled).toBe(true);
    });

    it("should disable paste when there is no workout to paste into", () => {
      // Arrange
      hoisted.clipboard = true;
      setStore({ currentWorkout: null });

      // Act
      const enabled = byId("paste")?.enabled;

      // Assert
      expect(enabled).toBe(false);
    });
  });

  describe("run delegation", () => {
    it("should open the block dialog rather than grouping directly", () => {
      // Arrange
      const openCreateBlockDialog = vi.fn();
      setStore({ selectedStepIds: ["a", "b"], openCreateBlockDialog });

      // Act
      byId("create-block")?.run();

      // Assert
      expect(openCreateBlockDialog).toHaveBeenCalledOnce();
    });

    it("should delegate undo to the store action", () => {
      // Arrange
      const undo = vi.fn();
      setStore({ canUndo: true, undo });

      // Act
      byId("undo")?.run();

      // Assert
      expect(undo).toHaveBeenCalledOnce();
    });

    it("should not run a store action while the guard is closed", () => {
      // Arrange
      const openCreateBlockDialog = vi.fn();
      setStore({ selectedStepIds: ["a"], openCreateBlockDialog });

      // Act
      byId("create-block")?.run();

      // Assert
      expect(openCreateBlockDialog).not.toHaveBeenCalled();
    });
  });

  describe("learn entries", () => {
    it("should open the docs site in a new tab", () => {
      // Arrange
      const open = vi.spyOn(window, "open").mockReturnValue(null);

      // Act
      byId("learn-quick-start")?.run();

      // Assert
      expect(open).toHaveBeenCalledWith(
        "https://kaiord.com/docs/guide/quick-start",
        "_blank",
        "noopener,noreferrer"
      );
    });

    it("should mark every learn entry runnable", () => {
      // Arrange

      // Act
      const learn = commands().filter((command) => command.group === "learn");

      // Assert
      expect(learn.length).toBeGreaterThanOrEqual(2);
      expect(learn.every((command) => command.enabled)).toBe(true);
    });
  });

  describe("catalog and i18n pairing", () => {
    it("should resolve every shortcutId to a catalog row", () => {
      // Arrange
      const ids = new Set(SHORTCUT_CATALOG.map((def) => def.id));

      // Act
      const strays = commands()
        .map((command) => command.shortcutId)
        .filter((id): id is string => id !== undefined)
        .filter((id) => !ids.has(id));

      // Assert
      expect(strays).toEqual([]);
    });

    it("should resolve every title and subtitle in the palette namespace", () => {
      // Arrange
      const keys = commands().flatMap((command) =>
        [command.titleKey, command.subtitleKey].filter(
          (key): key is string => key !== undefined
        )
      );

      // Act
      const unresolved = keys.filter((key) => typeof resolve(key) !== "string");

      // Assert
      expect(unresolved).toEqual([]);
    });

    it("should keep every command id unique", () => {
      // Arrange
      const ids = commands().map((command) => command.id);

      // Act
      const unique = new Set(ids);

      // Assert
      expect(unique.size).toBe(ids.length);
    });
  });
});
