import { describe, expect, it, vi } from "vitest";

import type { EditorCommand } from "../../../hooks/editor-command.types";
import type { Translate } from "../../../i18n/use-translate";
import { filterCommands, flattenSections } from "./command-palette-filter";

const TITLES: Record<string, string> = {
  "commands.create-block.title": "Group the selected steps into a block",
  "commands.undo.title": "Undo the last change",
  "learn.formats.title": "Cómo se guardan los entrenamientos",
};

const t: Translate = (key) => TITLES[key] ?? key;

const COMMANDS: ReadonlyArray<EditorCommand> = [
  {
    id: "create-block",
    group: "do",
    titleKey: "commands.create-block.title",
    enabled: true,
    run: vi.fn(),
  },
  {
    id: "undo",
    group: "do",
    titleKey: "commands.undo.title",
    enabled: true,
    run: vi.fn(),
  },
  {
    id: "learn-formats",
    group: "learn",
    titleKey: "learn.formats.title",
    enabled: true,
    run: vi.fn(),
  },
];

describe("filterCommands", () => {
  describe("grouping", () => {
    it("should return the do section before the learn section", () => {
      // Arrange

      // Act
      const sections = filterCommands(COMMANDS, "", t);

      // Assert
      expect(sections.map((section) => section.group)).toEqual(["do", "learn"]);
    });

    it("should drop a section that has no match", () => {
      // Arrange

      // Act
      const sections = filterCommands(COMMANDS, "undo", t);

      // Assert
      expect(sections.map((section) => section.group)).toEqual(["do"]);
    });

    it("should keep every command when the query is blank", () => {
      // Arrange

      // Act
      const flat = flattenSections(filterCommands(COMMANDS, "   ", t));

      // Assert
      expect(flat).toHaveLength(COMMANDS.length);
    });
  });

  describe("matching", () => {
    it("should match a substring of the translated title", () => {
      // Arrange

      // Act
      const flat = flattenSections(filterCommands(COMMANDS, "block", t));

      // Assert
      expect(flat.map((command) => command.id)).toEqual(["create-block"]);
    });

    it("should ignore case", () => {
      // Arrange

      // Act
      const flat = flattenSections(filterCommands(COMMANDS, "UNDO", t));

      // Assert
      expect(flat.map((command) => command.id)).toEqual(["undo"]);
    });

    it("should ignore accents", () => {
      // Arrange

      // Act
      const flat = flattenSections(filterCommands(COMMANDS, "como", t));

      // Assert
      expect(flat.map((command) => command.id)).toEqual(["learn-formats"]);
    });

    it("should return no section when nothing matches", () => {
      // Arrange

      // Act
      const sections = filterCommands(COMMANDS, "zzz", t);

      // Assert
      expect(sections).toEqual([]);
    });
  });
});
