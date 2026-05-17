import { describe, it } from "node:test";
import assert from "node:assert/strict";

import {
  ALLOWLIST,
  checkSingleEntry,
  isFlagEnabled,
} from "./check-settings-single-entry.mjs";

describe("isFlagEnabled", () => {
  it("returns false when flag is set to false", () => {
    const src = `export const FEATURE_FLAGS = { "ux2026.unifiedSettings": false };`;
    assert.equal(isFlagEnabled(src), false);
  });

  it("returns true when flag is set to true", () => {
    const src = `export const FEATURE_FLAGS = { "ux2026.unifiedSettings": true };`;
    assert.equal(isFlagEnabled(src), true);
  });

  it("returns false when the flag entry is missing", () => {
    const src = `export const FEATURE_FLAGS = { "ux2026.spineHeader": true };`;
    assert.equal(isFlagEnabled(src), false);
  });
});

describe("checkSingleEntry", () => {
  describe("no direct imports", () => {
    it("returns no errors for files that do not import SettingsPanel or ProfileManager", () => {
      const errors = checkSingleEntry(
        `import { Button } from "../atoms/Button/Button";`,
        "src/foo.tsx"
      );
      assert.deepEqual(errors, []);
    });
  });

  describe("direct SettingsPanel import", () => {
    it("flags a direct import of SettingsPanel", () => {
      const errors = checkSingleEntry(
        `import { SettingsPanel } from "../organisms/SettingsPanel/SettingsPanel";`,
        "src/foo.tsx"
      );
      assert.equal(errors.length, 1);
      assert.ok(errors[0].includes("SettingsPanel"));
      assert.ok(errors[0].includes("src/foo.tsx:1"));
    });
  });

  describe("direct ProfileManager import", () => {
    it("flags a direct import of ProfileManager", () => {
      const errors = checkSingleEntry(
        `import { ProfileManager } from "../organisms/ProfileManager/ProfileManager";`,
        "src/foo.tsx"
      );
      assert.equal(errors.length, 1);
      assert.ok(errors[0].includes("ProfileManager"));
    });
  });

  describe("allowlist", () => {
    it("exempts files in the allowlist", () => {
      const allow = new Set(["src/legacy.tsx"]);
      const errors = checkSingleEntry(
        `import { SettingsPanel } from "../organisms/SettingsPanel/SettingsPanel";`,
        "src/legacy.tsx",
        allow
      );
      assert.deepEqual(errors, []);
    });
  });

  describe("ALLOWLIST is empty initially", () => {
    it("ships with an empty allowlist (production initial)", () => {
      assert.equal(ALLOWLIST.size, 0);
    });
  });
});
