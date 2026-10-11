/**
 * PII / secret audit for the per-profile model section error toasts.
 *
 * Mirrors use-ai-tab-handlers.audit.test.ts: axis 1 checks every toast key
 * has fixed English and Spanish text that names no key; axis 2 walks the
 * source and confirms every `toast.error(...)` argument is a translation of
 * a string-literal key, never an interpolation that could splice an
 * `apiKey` fragment.
 */

import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

import en from "../../../i18n/locales/en/settings.json";
import es from "../../../i18n/locales/es/settings.json";
import { AI_MODELS_TOAST_KEYS } from "./use-ai-models-handlers";

const textOf = (catalogue: unknown, key: string): unknown =>
  key
    .split(".")
    .reduce<unknown>(
      (node, part) => (node as Record<string, unknown> | undefined)?.[part],
      catalogue
    );

// One level of nested parentheses, so `t("key")` is captured whole.
const TOAST_CALL_REGEX = /toast\.error\(((?:[^()]|\([^()]*\))*)\)/g;

describe("AI models handlers toast PII / secret audit", () => {
  it("should expose a finite allowlist of error messages", () => {
    // Arrange

    // Act

    // Assert
    expect(AI_MODELS_TOAST_KEYS.length).toBeGreaterThan(0);
    for (const key of AI_MODELS_TOAST_KEYS) {
      for (const catalogue of [en, es]) {
        const message = textOf(catalogue, key);
        expect(typeof message).toBe("string");
        expect(message).not.toMatch(/sk-|apiKey|provider\.|\{\{/i);
      }
    }
  });

  it("should pass toast.error a fixed translation (no interpolation)", () => {
    // Arrange
    const source = readFileSync(
      resolve(__dirname, "use-ai-models-handlers.ts"),
      "utf8"
    );

    // Act
    const matches = [...source.matchAll(TOAST_CALL_REGEX)];

    // Assert
    expect(matches.length).toBeGreaterThan(0);
    for (const [, arg] of matches) {
      const trimmed = arg.trim();
      expect(trimmed).not.toContain("`");
      expect(trimmed).toMatch(/^t\("[a-zA-Z.]+"\)$/);
    }
  });
});
