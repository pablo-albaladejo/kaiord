/**
 * PII / secret audit for the AI settings tab error toasts.
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

const CONSUMER_FILES = [
  "use-ai-tab-handlers.ts",
  "PrivacyTab.tsx",
];

const TOAST_CALL_REGEX = /toast\.error\(([^)]*)\)/g;

describe("AI tab toast PII / secret audit", () => {
  it("exposes a finite allowlist of error messages", () => {
    expect(AI_TAB_TOAST_MESSAGES.length).toBeGreaterThan(0);
    for (const message of AI_TAB_TOAST_MESSAGES) {
      expect(message).not.toMatch(/sk-|apiKey|provider\./i);
    }
  });

  it.each(CONSUMER_FILES)(
    "%s passes toast.error a bare identifier (no template-literal interpolation)",
    (filename) => {
      const source = readFileSync(resolve(__dirname, filename), "utf8");
      const matches = [...source.matchAll(TOAST_CALL_REGEX)];
      expect(matches.length).toBeGreaterThan(0);
      for (const [, arg] of matches) {
        const trimmed = arg.trim();
        // Ban any backtick-templated argument outright.
        expect(trimmed).not.toContain("`");
        // Allow either a literal string or an identifier (constant ref).
        const isLiteral =
          (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
          (trimmed.startsWith("'") && trimmed.endsWith("'"));
        const isIdentifier = /^[A-Z_][A-Z0-9_]*$/.test(trimmed);
        expect(isLiteral || isIdentifier).toBe(true);
      }
    }
  );
});
