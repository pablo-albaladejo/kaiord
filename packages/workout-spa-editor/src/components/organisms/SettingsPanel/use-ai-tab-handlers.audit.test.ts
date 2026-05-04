/**
 * PII / secret audit for the AI settings tab error toasts.
 *
 * Defense-in-depth: scripts/check-no-pii-leakage.mjs provides repo-wide
 * coverage of the same rule across components / hooks / lib. This
 * focused vitest variant catches regressions in the AI tab's specific
 * test surface — two test layers catching the same regression is the
 * intent.
 *
 * Axis 1 (allowlist match) is implicit: every error toast in
 * `useAiTabHandlers` is rendered with one of the exported
 * `AI_TAB_TOAST_MESSAGES` constants. Axis 2 (literal-source) walks
 * the source file and confirms every `toast.error(...)` argument is
 * a bare identifier referencing one of those constants — no
 * template-literal interpolation that could splice an `apiKey`
 * fragment via `error.message` or similar.
 */

import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

import { AI_TAB_TOAST_MESSAGES } from "./use-ai-tab-handlers";

const CONSUMER_FILES = ["use-ai-tab-handlers.ts", "PrivacyTab.tsx"];

const TOAST_CALL_REGEX = /toast\.error\(([^)]*)\)/g;

describe("AI tab toast PII / secret audit", () => {
  it("should expose a finite allowlist of error messages", () => {
    // Arrange

    // Act

    // Assert
    expect(AI_TAB_TOAST_MESSAGES.length).toBeGreaterThan(0);
    for (const message of AI_TAB_TOAST_MESSAGES) {
      expect(message).not.toMatch(/sk-|apiKey|provider\./i);
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
        // Require a SCREAMING_SNAKE_CASE identifier so the argument
        // resolves to a top-level const at audit time. Inline string
        // literals would still be safe today but lower the bar for
        // future drift toward `\`...${error.message}\`` style.
        expect(trimmed).toMatch(/^[A-Z_][A-Z0-9_]*$/);
      }
    }
  );
});
