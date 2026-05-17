import { describe, it } from "node:test";
import assert from "node:assert/strict";

import {
  ALLOWLIST,
  checkSingleEntry,
  isFlagEnabled,
} from "./check-settings-single-entry.mjs";

describe("isFlagEnabled", () => {
  it("should return false when flag is set to false", () => {
    // Arrange
    const src = `export const FEATURE_FLAGS = { "ux2026.unifiedSettings": false };`;

    // Act
    const result = isFlagEnabled(src);

    // Assert
    assert.equal(result, false);
  });

  it("should return true when flag is set to true", () => {
    // Arrange
    const src = `export const FEATURE_FLAGS = { "ux2026.unifiedSettings": true };`;

    // Act
    const result = isFlagEnabled(src);

    // Assert
    assert.equal(result, true);
  });

  it("should return false when the flag entry is missing", () => {
    // Arrange
    const src = `export const FEATURE_FLAGS = { "ux2026.spineHeader": true };`;

    // Act
    const result = isFlagEnabled(src);

    // Assert
    assert.equal(result, false);
  });

  it("should return true when the key uses single quotes", () => {
    // Arrange
    const src = `export const FEATURE_FLAGS = { 'ux2026.unifiedSettings': true };`;

    // Act
    const result = isFlagEnabled(src);

    // Assert
    assert.equal(result, true);
  });

  it("should return true when the key is a bare identifier (no quotes)", () => {
    // Arrange
    const src = `export const FEATURE_FLAGS = { ux2026.unifiedSettings: true };`;

    // Act
    const result = isFlagEnabled(src);

    // Assert
    assert.equal(result, true);
  });
});

describe("checkSingleEntry", () => {
  describe("no direct imports", () => {
    it("should return no errors for files that do not import SettingsPanel or ProfileManager", () => {
      // Arrange
      const src = `import { Button } from "../atoms/Button/Button";`;

      // Act
      const errors = checkSingleEntry(src, "src/foo.tsx");

      // Assert
      assert.deepEqual(errors, []);
    });
  });

  describe("direct SettingsPanel import", () => {
    it("should flag a direct import of SettingsPanel", () => {
      // Arrange
      const src = `import { SettingsPanel } from "../organisms/SettingsPanel/SettingsPanel";`;

      // Act
      const errors = checkSingleEntry(src, "src/foo.tsx");

      // Assert
      assert.equal(errors.length, 1);
      assert.ok(errors[0].includes("SettingsPanel"));
      assert.ok(errors[0].includes("src/foo.tsx:1"));
    });
  });

  describe("direct ProfileManager import", () => {
    it("should flag a direct import of ProfileManager", () => {
      // Arrange
      const src = `import { ProfileManager } from "../organisms/ProfileManager/ProfileManager";`;

      // Act
      const errors = checkSingleEntry(src, "src/foo.tsx");

      // Assert
      assert.equal(errors.length, 1);
      assert.ok(errors[0].includes("ProfileManager"));
    });
  });

  describe("allowlist", () => {
    it("should exempt files in the allowlist", () => {
      // Arrange
      const allow = new Set(["src/legacy.tsx"]);
      const src = `import { SettingsPanel } from "../organisms/SettingsPanel/SettingsPanel";`;

      // Act
      const errors = checkSingleEntry(src, "src/legacy.tsx", allow);

      // Assert
      assert.deepEqual(errors, []);
    });
  });

  describe("multiline imports", () => {
    it("should flag a SettingsPanel import split across multiple lines", () => {
      // Arrange
      const src = [
        "import {",
        "  SettingsPanel,",
        '} from "../organisms/SettingsPanel/SettingsPanel";',
        "",
      ].join("\n");

      // Act
      const errors = checkSingleEntry(src, "src/multi.tsx");

      // Assert
      assert.equal(errors.length, 1);
      assert.ok(errors[0].includes("SettingsPanel"));
      assert.ok(errors[0].includes("src/multi.tsx:1"));
    });
  });

  describe("ALLOWLIST is empty initially", () => {
    it("should ship with an empty allowlist (production initial)", () => {
      // Arrange

      // Act
      const size = ALLOWLIST.size;

      // Assert
      assert.equal(size, 0);
    });
  });
});
