import { describe, expect, it } from "vitest";

import type { FeatureFlagName } from "./feature-flags";
import {
  FEATURE_FLAGS,
  isFeatureFlagEnabled,
  useFeatureFlag,
} from "./feature-flags";

describe("feature-flags", () => {
  describe("FEATURE_FLAGS map", () => {
    it("should default every ux2026 flag to false", () => {
      // Arrange

      // Act

      const enabled = Object.entries(FEATURE_FLAGS).filter(
        ([, value]) => value === true
      );

      // Assert

      expect(enabled).toEqual([]);
    });

    it("should namespace every flag under ux2026.", () => {
      // Arrange

      // Act

      const wrongNamespace = Object.keys(FEATURE_FLAGS).filter(
        (key) => !key.startsWith("ux2026.")
      );

      // Assert

      expect(wrongNamespace).toEqual([]);
    });
  });

  describe("useFeatureFlag", () => {
    it("should return the constant value for a known flag", () => {
      // Arrange

      const name: FeatureFlagName = "ux2026.spineHeader";

      // Act

      const value = useFeatureFlag(name);

      // Assert

      expect(value).toBe(false);
    });

    it("should return false for every flag in the default map", () => {
      // Arrange

      const names = Object.keys(FEATURE_FLAGS) as Array<FeatureFlagName>;

      // Act

      const values = names.map((name) => useFeatureFlag(name));

      // Assert

      expect(values.every((v) => v === false)).toBe(true);
    });
  });

  describe("isFeatureFlagEnabled", () => {
    it("should match useFeatureFlag for every flag", () => {
      // Arrange

      const names = Object.keys(FEATURE_FLAGS) as Array<FeatureFlagName>;

      // Act

      const mismatches = names.filter(
        (name) => useFeatureFlag(name) !== isFeatureFlagEnabled(name)
      );

      // Assert

      expect(mismatches).toEqual([]);
    });
  });
});
