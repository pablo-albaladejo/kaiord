/**
 * PII / secret audit for the per-profile model section error toasts.
 *
 * Mirrors use-ai-tab-handlers.audit.test.ts: axis 1 confirms a finite
 * allowlist; axis 2 walks the source and confirms every `toast.error(...)`
 * argument is a bare SCREAMING_SNAKE_CASE identifier, never an
 * interpolation that could splice an `apiKey` fragment.
 */

import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

import { AI_MODELS_TOAST_MESSAGES } from "./use-ai-models-handlers";

const TOAST_CALL_REGEX = /toast\.error\(([^)]*)\)/g;

describe("AI models handlers toast PII / secret audit", () => {
  it("should expose a finite allowlist of error messages", () => {
    // Arrange

    // Act

    // Assert
    expect(AI_MODELS_TOAST_MESSAGES.length).toBeGreaterThan(0);
    for (const message of AI_MODELS_TOAST_MESSAGES) {
      expect(message).not.toMatch(/sk-|apiKey|provider\./i);
    }
  });

  it("should pass toast.error a bare identifier (no interpolation)", () => {
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
      expect(trimmed).toMatch(/^[A-Z_][A-Z0-9_]*$/);
    }
  });
});
