import { describe, expect, it } from "vitest";

import { HANDLER_KEYS } from "../hooks/keyboard-shortcut-handlers";
import enHelp from "../i18n/locales/en/help.json";
import { SHORTCUT_CATALOG, SHORTCUT_GROUPS } from "./shortcut-catalog";

const resolve = (key: string): unknown =>
  key
    .split(".")
    .reduce<unknown>(
      (acc, segment) =>
        acc && typeof acc === "object"
          ? (acc as Record<string, unknown>)[segment]
          : undefined,
      enHelp
    );

describe("SHORTCUT_CATALOG", () => {
  describe("handler pairing", () => {
    it.each(HANDLER_KEYS)(
      "should document the %s handler in exactly one catalog row",
      (handlerKey) => {
        // Arrange

        // Act
        const rows = SHORTCUT_CATALOG.filter(
          (def) => def.handlerKey === handlerKey
        );

        // Assert
        expect(rows).toHaveLength(1);
      }
    );

    it("should not reference a handler that no longer exists", () => {
      // Arrange
      const known = new Set<string>(HANDLER_KEYS);

      // Act
      const unknown = SHORTCUT_CATALOG.filter(
        (def) => def.handlerKey !== null && !known.has(def.handlerKey)
      );

      // Assert
      expect(unknown).toEqual([]);
    });
  });

  describe("i18n pairing", () => {
    it.each(SHORTCUT_CATALOG)(
      "should resolve the label of $id in the English help namespace",
      (def) => {
        // Arrange

        // Act
        const label = resolve(def.labelKey);

        // Assert
        expect(typeof label).toBe("string");
      }
    );

    it.each(SHORTCUT_GROUPS)(
      "should resolve the %s group heading in the English help namespace",
      (group) => {
        // Arrange

        // Act
        const heading = resolve(`shortcuts.${group}.heading`);

        // Assert
        expect(typeof heading).toBe("string");
      }
    );
  });

  describe("row shape", () => {
    it("should keep every row id unique", () => {
      // Arrange
      const ids = SHORTCUT_CATALOG.map((def) => def.id);

      // Act
      const unique = new Set(ids);

      // Assert
      expect(unique.size).toBe(ids.length);
    });

    it("should place every row in a known group", () => {
      // Arrange
      const groups = new Set<string>(SHORTCUT_GROUPS);

      // Act
      const strays = SHORTCUT_CATALOG.filter((def) => !groups.has(def.group));

      // Assert
      expect(strays).toEqual([]);
    });

    it("should give every row at least one key", () => {
      // Arrange

      // Act
      const empty = SHORTCUT_CATALOG.filter((def) => def.keys.length === 0);

      // Assert
      expect(empty).toEqual([]);
    });
  });
});
