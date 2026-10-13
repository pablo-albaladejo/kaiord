/**
 * PII / secret audit for the AI settings tab error toasts.
 *
 * Defense-in-depth: scripts/check-no-pii-leakage.mjs provides repo-wide
 * coverage of the same rule across components / hooks / lib. This
 * focused vitest variant catches regressions in the AI tab's specific
 * test surface — two test layers catching the same regression is the
 * intent.
 *
 * Axis 1 (allowlist match): every error toast in `useAiTabHandlers` is
 * one of the exported `AI_TAB_TOAST_KEYS`, and its English and Spanish
 * text names no key. Axis 2 (literal-source) walks the source and confirms
 * every `toast.error(...)` argument is a SCREAMING_SNAKE_CASE constant or
 * a translation of a string-literal key — no template-literal
 * interpolation that could splice an `apiKey` fragment via
 * `error.message` or similar.
 */

import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

import en from "../../../i18n/locales/en/settings.json";
import es from "../../../i18n/locales/es/settings.json";
import { AI_TAB_TOAST_KEYS } from "./use-ai-tab-handlers";

const textOf = (catalogue: unknown, key: string): unknown =>
  key
    .split(".")
    .reduce<unknown>(
      (node, part) => (node as Record<string, unknown> | undefined)?.[part],
      catalogue
    );

const CONSUMER_FILES = ["use-ai-tab-handlers.ts", "ClearApiKeysSection.tsx"];

// One level of nested parentheses, so `t("key")` is captured whole.
const TOAST_CALL_REGEX = /toast\.error\(((?:[^()]|\([^()]*\))*)\)/g;

describe("AI tab toast PII / secret audit", () => {
  it("should expose a finite allowlist of error messages", () => {
    // Arrange

    // Act

    // Assert
    expect(AI_TAB_TOAST_KEYS.length).toBeGreaterThan(0);
    for (const key of AI_TAB_TOAST_KEYS) {
      for (const catalogue of [en, es]) {
        const message = textOf(catalogue, key);
        expect(typeof message).toBe("string");
        expect(message).not.toMatch(/sk-|apiKey|provider\.|\{\{/i);
      }
    }
  });

  it.each(CONSUMER_FILES)(
    "should pass toast.error a bare identifier (no template-literal interpolation) for %s",
    (filename) => {
      // Arrange

      const source = readFileSync(resolve(__dirname, filename), "utf8");

      // Act

      const matches = [...source.matchAll(TOAST_CALL_REGEX)];

      // Assert

      expect(matches.length).toBeGreaterThan(0);
      for (const [, arg] of matches) {
        const trimmed = arg.trim();
        // Ban any backtick-templated argument outright.
        expect(trimmed).not.toContain("`");
        // Require a SCREAMING_SNAKE_CASE constant or `t("literal.key")`
        // with no parameters, so the text is fixed at audit time.
        // Inline string literals would still be safe today but lower the
        // bar for future drift toward `\`...${error.message}\`` style.
        expect(trimmed).toMatch(/^(?:[A-Z_][A-Z0-9_]*|t\("[a-zA-Z.]+"\))$/);
      }
    }
  );
});
